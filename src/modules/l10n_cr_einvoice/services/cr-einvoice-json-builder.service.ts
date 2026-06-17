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
    let receptor: any = undefined;

    if (contactData) {
      const receptorNombre =
        `${contactData.name ?? ""} ${contactData.lastName ?? ""}`.trim() ||
        contactData.name ||
        "";

      const receptorIdentificacion =
        contactData.crVatType && contactData.vat
          ? { Tipo: contactData.crVatType, Numero: contactData.vat }
          : undefined;

      // Ubicacion is optional for Receptor
      let receptorUbicacion: any = undefined;
      if (contactData.state) {
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
        NombreComercial: contactData.commercialName || undefined,
        Ubicacion: receptorUbicacion,
        CorreoElectronico: contactData.email ?? "",
      };
    }

    // ── Actividad Económica — use invoice-stored selection, fall back to first ─
    const codigoActividadEmisor: string =
      entry.crCodigoActividadEmisor ||
      emisorContact?.crEconomicActivityCodes?.[0]?.code ||
      "";

    const codigoActividadReceptor: string | undefined =
      entry.crCodigoActividadReceptor ||
      contactData?.crEconomicActivityCodes?.[0]?.code ||
      undefined;

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

      // Accumulate service/goods subtotals (pre-tax)
      if (firstTax) {
        if (isService) {
          totalServGravados = parseFloat(
            (totalServGravados + subTotal).toFixed(5),
          );
        } else {
          totalMercanciasGravadas = parseFloat(
            (totalMercanciasGravadas + subTotal).toFixed(5),
          );
        }
        // Tax breakdown per code
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

      return {
        NumeroLinea: index + 1,
        PartidaArancelaria: false,
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
    if (totalImpuesto > 0)
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
        entry.crPlazoCredito != null ? String(entry.crPlazoCredito) : undefined,
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

    return {
      invoice: {
        fe_version: settings.feVersion ?? "4.4",
        FacturaElectronica: facturaElectronica,
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
