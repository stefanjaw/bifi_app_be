import { ValidationException } from "../../../system";
import { ConnectionManager } from "../../../system/libraries/base-module/connection-manager";
import { CrEinvoiceSettingsDocument } from "../settings/models/cr-einvoice-settings.model";
import { crEinvoicePdfService } from "./cr-einvoice-pdf.service";

export class CrEinvoiceJsonBuilderService {
  private connectionManager = new ConnectionManager();

  async buildFromJournalEntry(
    entry: any,
    settings: CrEinvoiceSettingsDocument,
  ): Promise<object> {
    const condicionVenta =
      (entry.crCondicionVentaId as any)?.code ?? entry.crCondicionVentaId ?? "";
    const medioPago =
      (entry.crMedioPagoId as any)?.code ?? entry.crMedioPagoId ?? "";

    const rawDate = entry.crFechaEmision ?? entry.date;
    const fechaEmision = rawDate
      ? this.formatFechaEmision(new Date(rawDate))
      : new Date().toISOString().replace("Z", "-06:00");

    const productLines = (entry.lines ?? []).filter(
      (l: any) => !l.lineType || l.lineType === "product",
    );

    // ── Currency ──────────────────────────────────────────────────────────────
    const currency = entry.currencyId as any;
    const codigoMoneda = currency?.code ?? "CRC";

    // ── Emisor ────────────────────────────────────────────────────────────────
    const emisorCompany = (settings as any).emisorCompanyId as any;
    const emisorContact = emisorCompany?.contactId as any;

    // Ubicacion is always required for Emisor — build unconditionally
    const emisorUbicacion: any = {};
    if (emisorContact?.state) emisorUbicacion.Provincia = emisorContact.state;
    if (emisorContact?.city) emisorUbicacion.Canton = emisorContact.city;
    if (emisorContact?.crDistrito)
      emisorUbicacion.Distrito = emisorContact.crDistrito;
    if (emisorContact?.streetAddress)
      emisorUbicacion.OtrasSenas = emisorContact.streetAddress;

    const emisor: any = {
      Nombre: emisorContact?.name ?? emisorCompany?.name ?? "",
      Identificacion: {
        Tipo: emisorContact?.crVatType ?? "02",
        Numero: (emisorContact?.vat ?? "").replace(/\D/g, ""),
      },
      NombreComercial: emisorContact?.commercialName || undefined,
      Ubicacion: emisorUbicacion,
      Telefono: emisorContact?.phoneNumber
        ? { CodigoPais: "506", NumTelefono: emisorContact.phoneNumber }
        : undefined,
      CorreoElectronico: emisorContact?.email ?? "",
    };

    // ── Receptor ─────────────────────────────────────────────────────────────
    const contactData = entry.contactId as any;
    // FEE: Receptor.Ubicacion is inexistente (spec condition 4); also route
    // foreign-buyer ID through IdentificacionExtranjero when crVatType === '05'.
    const einvoiceType: string = entry.crEinvoiceType ?? "FE";
    const isFEE = einvoiceType === "FEE";
    let receptor: any = undefined;

    if (contactData) {
      const receptorNombre =
        `${contactData.name ?? ""} ${contactData.lastName ?? ""}`.trim() ||
        contactData.name ||
        "";

      // crVatType '05' = Extranjero No Domiciliado → use IdentificacionExtranjero
      const isExtranjero = contactData.crVatType === "05";

      const receptorIdentificacion =
        !isExtranjero && contactData.crVatType && contactData.vat
          ? { Tipo: contactData.crVatType, Numero: contactData.vat }
          : undefined;

      const identificacionExtranjero =
        isExtranjero && contactData.vat ? contactData.vat : undefined;

      // Ubicacion: condition 4 (inexistente) for FEE; optional for all others
      let receptorUbicacion: any = undefined;
      if (!isFEE && contactData.state) {
        receptorUbicacion = { Provincia: contactData.state };
        if (contactData.city) receptorUbicacion.Canton = contactData.city;
        if (contactData.crDistrito)
          receptorUbicacion.Distrito = contactData.crDistrito;
        if (contactData.streetAddress)
          receptorUbicacion.OtrasSenas = contactData.streetAddress;
      }

      receptor = {
        Nombre: receptorNombre,
        Identificacion: receptorIdentificacion,
        IdentificacionExtranjero: identificacionExtranjero,
        NombreComercial: contactData.commercialName || undefined,
        Ubicacion: receptorUbicacion,
        CorreoElectronico: contactData.email ?? "",
      };
    }

    // ── Actividad Económica — use invoice-stored selection, fall back to first ─
    // Pass the raw string as-is: Hacienda expects the exact stored format
    // (e.g. "4741.0" for FEE which has minLength='6' in the XSD).
    const _rawActEmisor: string =
      entry.crCodigoActividadEmisor ||
      emisorContact?.crEconomicActivityCodes?.[0]?.code ||
      "";
    const codigoActividadEmisor: string = _rawActEmisor ?? "";

    // TE XSD does not have CodigoActividadReceptor — omit for TE.
    // FEC requires it; FEE omits it (foreign buyers have no CR activity code).
    // All other types accept it as optional.
    const _rawActReceptor: string | undefined =
      einvoiceType === "TE" || isFEE
        ? undefined
        : entry.crCodigoActividadReceptor ||
          contactData?.crEconomicActivityCodes?.[0]?.code ||
          undefined;
    const codigoActividadReceptor: string | undefined =
      _rawActReceptor ?? undefined;

    // ── LineaDetalle ─────────────────────────────────────────────────────────
    let totalServGravados = 0;
    let totalServExentos = 0;
    let totalMercanciasGravadas = 0;
    let totalMercanciasExentas = 0;
    let linesTotalImpuesto = 0;

    // Tax breakdown map keyed by "crCodigo|crCodigoTarifa"
    const taxBreakdown: Map<
      string,
      { Codigo: string; CodigoTarifaIVA: string; total: number }
    > = new Map();

    const lineaDetalle = productLines.map((line: any, index: number) => {
      const cantidad = line.quantity ?? 1;
      const precioUnitario = line.unitPrice ?? 0;
      const subTotal = parseFloat((cantidad * precioUnitario).toFixed(5));

      const product = line.productId as any;
      const uom = product?.unitOfMeasureId as any;
      const unidadMedida: string = uom?.crUnidadMedida || "Sp";
      const codigoProducto: string = product?.codigoComercial || "N/A";

      // Service vs. merchandise classification via productKind
      const isService: boolean = product?.productKind === "service";

      // Only populated, valid tax objects (autopopulate delivers full objects)
      const taxes: any[] = (line.taxIds ?? []).filter(
        (t: any) => t && typeof t === "object" && t._id && t.crCodigo,
      );

      // Hacienda spec: one Impuesto object per line (use the first applicable tax)
      const firstTax = taxes[0] ?? null;
      const tarifa: number = firstTax
        ? (firstTax.crTarifa ?? firstTax.percentage ?? 0)
        : 0;
      const impuestoNeto = firstTax
        ? parseFloat(((subTotal * tarifa) / 100).toFixed(5))
        : 0;

      // Accumulate service/goods subtotals (pre-tax).
      // Classification by CodigoTarifaIVA per Hacienda v4.4 spec (Nota 8.1):
      //   tarifa '10' (Tarifa Exenta, Ley 9635 Art.8) → exento bucket, not gravado
      //   tarifa '01'/'11' (No Sujeto)                → exento bucket for now (no sujeto bucket TBD)
      //   any other non-zero tarifa                   → gravado bucket + taxBreakdown
      //   no tax block at all                         → exento bucket
      const isExentoOrNoSujeto =
        !firstTax ||
        firstTax.crCodigoTarifa === "10" ||
        firstTax.crCodigoTarifa === "01" ||
        firstTax.crCodigoTarifa === "11";

      if (!isExentoOrNoSujeto) {
        if (isService) {
          totalServGravados = parseFloat(
            (totalServGravados + subTotal).toFixed(5),
          );
        } else {
          totalMercanciasGravadas = parseFloat(
            (totalMercanciasGravadas + subTotal).toFixed(5),
          );
        }
        // Tax breakdown — only for truly gravado lines
        const key = `${firstTax.crCodigo}|${firstTax.crCodigoTarifa ?? ""}`;
        const existing = taxBreakdown.get(key);
        if (existing) {
          existing.total = parseFloat(
            (existing.total + impuestoNeto).toFixed(5),
          );
        } else {
          taxBreakdown.set(key, {
            Codigo: firstTax.crCodigo,
            CodigoTarifaIVA: firstTax.crCodigoTarifa ?? "",
            total: impuestoNeto,
          });
        }
      } else {
        if (isService) {
          totalServExentos = parseFloat(
            (totalServExentos + subTotal).toFixed(5),
          );
        } else {
          totalMercanciasExentas = parseFloat(
            (totalMercanciasExentas + subTotal).toFixed(5),
          );
        }
      }

      linesTotalImpuesto = parseFloat(
        (linesTotalImpuesto + impuestoNeto).toFixed(5),
      );

      const montoTotalLinea = parseFloat((subTotal + impuestoNeto).toFixed(5));

      // Impuesto is a single object (not an array); omitted entirely when no tax
      const impuesto = firstTax
        ? {
            Codigo: firstTax.crCodigo,
            Tarifa: tarifa.toFixed(2),
            CodigoTarifaIVA: firstTax.crCodigoTarifa ?? "",
            Monto: impuestoNeto.toFixed(5),
          }
        : undefined;

      // PartidaArancelaria is required for non-service goods lines in FEE;
      // server raises a clear error if it is missing.
      // BaseImponible and ImpuestoNeto follow the same logic for all types:
      // present when a tax is on the line, absent when no tax is on the line.
      return {
        NumeroLinea: index + 1,
        PartidaArancelaria: product?.crPartidaArancelaria || false,
        Codigo: codigoProducto,
        Cantidad: cantidad.toFixed(5),
        UnidadMedida: unidadMedida,
        Detalle: line.description ?? "",
        PrecioUnitario: precioUnitario.toFixed(5),
        MontoTotal: subTotal.toFixed(5),
        SubTotal: subTotal.toFixed(5),
        IVACobradoFabrica: false,
        BaseImponible: firstTax ? subTotal.toFixed(5) : undefined,
        Impuesto: impuesto,
        ImpuestoNeto: impuestoNeto.toFixed(5),
        MontoTotalLinea: montoTotalLinea.toFixed(5),
      };
    });

    // ── ResumenFactura totals — calculated from line items ────────────────────
    const totalGravado = parseFloat(
      (totalServGravados + totalMercanciasGravadas).toFixed(5),
    );
    const totalExento = parseFloat(
      (totalServExentos + totalMercanciasExentas).toFixed(5),
    );
    const totalVenta = parseFloat((totalGravado + totalExento).toFixed(5));
    const totalVentaNeta: number =
      totalVenta > 0 ? totalVenta : (entry.untaxedAmount ?? 0);
    const totalImpuesto: number =
      totalVenta > 0 ? linesTotalImpuesto : (entry.taxAmount ?? 0);
    const totalComprobante = parseFloat(
      (totalVentaNeta + totalImpuesto).toFixed(5),
    );

    // TotalDesgloseImpuesto — required when taxed lines exist
    const totalDesgloseImpuesto =
      taxBreakdown.size > 0
        ? Array.from(taxBreakdown.values()).map((e) => ({
            Codigo: e.Codigo,
            CodigoTarifaIVA: e.CodigoTarifaIVA,
            TotalMontoImpuesto: e.total.toFixed(5),
          }))
        : undefined;

    // ── FacturaElectronica — canonical field order ────────────────────────────
    const resumenFactura: any = {
      CodigoTipoMoneda: { CodigoMoneda: codigoMoneda, TipoCambio: 1 },
    };
    if (totalServGravados > 0)
      resumenFactura.TotalServGravados = totalServGravados.toFixed(5);
    if (totalServExentos > 0)
      resumenFactura.TotalServExentos = totalServExentos.toFixed(5);
    if (totalMercanciasGravadas > 0)
      resumenFactura.TotalMercanciasGravadas =
        totalMercanciasGravadas.toFixed(5);
    if (totalMercanciasExentas > 0)
      resumenFactura.TotalMercanciasExentas = totalMercanciasExentas.toFixed(5);
    resumenFactura.TotalGravado = totalGravado.toFixed(5);
    if (totalExento > 0) resumenFactura.TotalExento = totalExento.toFixed(5);
    resumenFactura.TotalVenta = totalVenta.toFixed(5);
    resumenFactura.TotalVentaNeta = totalVentaNeta.toFixed(5);
    if (totalDesgloseImpuesto)
      resumenFactura.TotalDesgloseImpuesto = totalDesgloseImpuesto;
    resumenFactura.TotalImpuesto = totalImpuesto.toFixed(5);
    resumenFactura.TotalComprobante = totalComprobante.toFixed(5);

    const facturaElectronica: any = {
      Clave: entry.crClave,
      ProveedorSistemas: settings.proveedorSistemas ?? "",
      CodigoActividadEmisor: codigoActividadEmisor,
      CodigoActividadReceptor: codigoActividadReceptor,
      NumeroConsecutivo: entry.crNumeroConsecutivo,
      FechaEmision: fechaEmision,
      Emisor: emisor,
      Receptor: receptor,
      CondicionVenta: condicionVenta,
      PlazoCredito:
        condicionVenta === "02" && entry.crPlazoCredito != null
          ? String(entry.crPlazoCredito)
          : undefined,
      MedioPago: medioPago,
      DetalleServicio: { LineaDetalle: lineaDetalle },
      ResumenFactura: resumenFactura,
    };

    // ── InformacionReferencia — required for NC / ND ──────────────────────────
    const ref = entry.crInformacionReferencia;
    if (ref?.tipoDocIR) {
      facturaElectronica.InformacionReferencia = {
        TipoDocIR: ref.tipoDocIR,
        ...(ref.tipoDocRefOTRO ? { TipoDocRefOTRO: ref.tipoDocRefOTRO } : {}),
        Numero: ref.numero,
        FechaEmisionIR: this.formatFechaEmision(new Date(ref.fechaEmisionIR)),
        Codigo: ref.codigo,
        ...(ref.codigoReferenciaOTRO
          ? { CodigoReferenciaOTRO: ref.codigoReferenciaOTRO }
          : {}),
        Razon: ref.razon,
      };
    }

    const [certificate, pdfBase64] = await Promise.all([
      this.resolveCertificateBase64(settings),
      crEinvoicePdfService.generateBase64(entry, settings).catch((err: any) => {
        console.error(
          "[CR E-Invoice] PDF generation failed:",
          err?.message ?? err,
        );
        return "";
      }),
    ]);

    facturaElectronica.PDF = pdfBase64;

    const EINVOICE_ROOT_KEYS: Record<string, string> = {
      FE: "FacturaElectronica",
      ND: "NotaDebitoElectronica",
      NC: "NotaCreditoElectronica",
      TE: "TiqueteElectronico",
      FEC: "FacturaElectronicaCompra",
      FEE: "FacturaElectronicaExportacion",
      REP: "ReciboElectronicoPago",
    };
    const rootKey =
      EINVOICE_ROOT_KEYS[entry.crEinvoiceType ?? "FE"] ?? "FacturaElectronica";

    return {
      invoice: {
        fe_version: settings.feVersion ?? "4.4",
        [rootKey]: facturaElectronica,
      },
      certificate,
      token_user_name: settings.haciendaUsername ?? "",
    };
  }

  async buildMensajeReceptor(
    entry: any,
    settings: any,
    clave: string,
    numeroConsecutivoReceptor: string,
  ): Promise<object> {
    const einvoiceType: string = entry.crEinvoiceType ?? "MA";
    const mensajeCode =
      einvoiceType === "MA" ? "1" : einvoiceType === "MAP" ? "2" : "3";

    const emisorContact = (settings as any).emisorCompanyId?.contactId as any;
    const receptorCedula = (emisorContact?.vat ?? "").replace(/\D/g, "");
    const tipoCedulaReceptor: string = emisorContact?.crVatType ?? "02";

    const contactData = entry.contactId as any;
    const emisorCedula =
      typeof contactData === "object"
        ? (contactData?.vat ?? "").replace(/\D/g, "")
        : "";
    const tipoCedulaEmisor: string =
      typeof contactData === "object" ? (contactData?.crVatType ?? "02") : "02";

    const rawDate = entry.crFechaEmision ?? entry.date;
    const fechaEmision = rawDate
      ? this.formatFechaEmision(new Date(rawDate))
      : new Date().toISOString().replace("Z", "-06:00");

    const isMR = mensajeCode === "3";

    // Use the stored taxAmount (set during import from TotalImpuesto in the original XML).
    // Recalculating from product lines is unreliable because imported invoices have taxIds: [].
    const montoTotalImpuesto: number = entry.taxAmount ?? 0;

    const _rawActividadMR: string =
      entry.crCodigoActividadEmisor ||
      emisorContact?.crEconomicActivityCodes?.[0]?.code ||
      "";
    const codigoActividad: string = _rawActividadMR
      ? String(Math.round(parseFloat(_rawActividadMR)))
      : "";

    const rawClave = String(entry.crClave ?? "");
    if (rawClave && (rawClave.includes("e") || rawClave.includes("E"))) {
      throw new ValidationException(
        "La Clave de este comprobante fue almacenada en notación científica y no puede enviarse a Hacienda. " +
          "Por favor re-importe el XML del comprobante para corregir el valor.",
      );
    }

    // Spec rules for Mensaje=3 (MR / Rechazo):
    //   - CondicionImpuesto: not applicable (omit)
    //   - MontoTotalAcreditar: "no es necesario su uso" → 0 / omit
    //   - MontoTotalGastoAplicable: same → 0 / omit
    //   - MontoTotalImpuesto: must match the referenced document's tax total
    //   - TotalFactura: must match the referenced document's total
    const mensajeReceptor: any = {
      Clave: rawClave,
      NumeroCedulaEmisor: emisorCedula,
      FechaEmisionDoc: fechaEmision,
      Mensaje: mensajeCode,
      MontoTotalImpuesto: parseFloat(montoTotalImpuesto.toFixed(5)),
      ActividadEconomica: codigoActividad,
      CondicionImpuesto: entry.crCondicionImpuesto ?? "01",
      MontoTotalAcreditar: isMR
        ? 0
        : (entry.crMontoTotalImpuestoAcreditar ?? 0),
      MontoTotalGastoAplicable: isMR
        ? 0
        : (entry.crMontoTotalGastoAplicable ?? 0),
      TotalFactura: entry.totalAmount ?? 0,
      TipoCedulaEmisor: tipoCedulaEmisor,
      NumeroCedulaReceptor: receptorCedula,
      TipoCedulaReceptor: tipoCedulaReceptor,
      NumeroConsecutivoReceptor: numeroConsecutivoReceptor,
    };

    if (entry.crDetalleMensaje) {
      mensajeReceptor.DetalleMensaje = entry.crDetalleMensaje;
    }

    const certificate = await this.resolveCertificateBase64(settings);
    console.log("Invoice:", mensajeReceptor);

    return {
      invoice: {
        fe_version: settings.feVersion ?? "4.4",
        MensajeReceptor: mensajeReceptor,
      },
      certificate,
      token_user_name: settings.haciendaUsername ?? "",
    };
  }

  private async resolveCertificateBase64(
    settings: CrEinvoiceSettingsDocument,
  ): Promise<string> {
    const fileId = (settings.certificateFile as any)?.fileId;
    if (!fileId) {
      console.warn(
        "[CR E-Invoice] No certificate file found in settings — submission will lack a signed certificate.",
      );
      return "";
    }

    try {
      const bucket = this.connectionManager.bindBucketToDb();
      const { bufferDownload } = await bucket.downloadFile(String(fileId));
      const buffer = await bufferDownload;
      const singleB64 = buffer.toString("base64");
      return Buffer.from(singleB64).toString("base64");
    } catch (err) {
      console.error(
        "[CR E-Invoice] Failed to load P12 certificate from GridFS:",
        err,
      );
      return "";
    }
  }

  private formatFechaEmision(date: Date): string {
    // CR is UTC-6; convert UTC to Costa Rica local time before formatting
    const cr = new Date(date.getTime() - 6 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = cr.getUTCFullYear();
    const MM = pad(cr.getUTCMonth() + 1);
    const dd = pad(cr.getUTCDate());
    const HH = pad(cr.getUTCHours());
    const mm = pad(cr.getUTCMinutes());
    const ss = pad(cr.getUTCSeconds());
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}-06:00`;
  }
}

export const crEinvoiceJsonBuilderService = new CrEinvoiceJsonBuilderService();
