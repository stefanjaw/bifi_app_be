import { CrEinvoiceSettingsDocument } from "../settings/models/cr-einvoice-settings.model";

export class CrEinvoiceJsonBuilderService {
  buildFromJournalEntry(entry: any, settings: CrEinvoiceSettingsDocument): object {
    const condicionVenta =
      (entry.crCondicionVentaId as any)?.code ?? entry.crCondicionVentaId ?? "";
    const medioPago =
      (entry.crMedioPagoId as any)?.code ?? entry.crMedioPagoId ?? "";

    const rawDate = entry.crFechaEmision ?? entry.date;
    const fechaEmision = rawDate
      ? this.formatFechaEmision(new Date(rawDate))
      : new Date().toISOString().replace("Z", "-06:00");

    const productLines = (entry.lines ?? []).filter(
      (l: any) => !l.lineType || l.lineType === "product"
    );

    const lineaDetalle = productLines.map((line: any, index: number) => {
      const cantidad = line.quantity ?? 1;
      const precioUnitario = line.unitPrice ?? 0;
      const montoTotal = cantidad * precioUnitario;
      return {
        NumeroLinea: index + 1,
        Cantidad: cantidad.toFixed(5),
        UnidadMedida: "Sp",
        Detalle: line.description ?? "",
        PrecioUnitario: precioUnitario.toFixed(5),
        MontoTotal: montoTotal.toFixed(5),
        SubTotal: montoTotal.toFixed(5),
        ImpuestoNeto: "0.00000",
        MontoTotalLinea: montoTotal.toFixed(5),
      };
    });

    const totalVenta = entry.totalAmount ?? 0;
    const totalImpuesto = entry.taxAmount ?? 0;
    const totalVentaNeta = entry.untaxedAmount ?? 0;

    const emisor: any = {
      Nombre: settings.emisorNombre ?? "",
      Identificacion: {
        Tipo: "02",
        Numero: settings.emisorCedula ?? "",
      },
      Correo: settings.emisorCorreo ?? "",
    };

    const contactData = entry.contactId;
    const receptor: any = contactData
      ? {
          Nombre:
            `${(contactData as any).name ?? ""} ${(contactData as any).lastName ?? ""}`.trim() ||
            "",
          CorreoElectronico: (contactData as any).email ?? "",
        }
      : undefined;

    const facturaElectronica: any = {
      Clave: entry.crClave,
      ProveedorSistemas: settings.proveedorSistemas ?? "",
      CodigoActividadEmisor: settings.economicActivityCode ?? "",
      NumeroConsecutivo: entry.crNumeroConsecutivo,
      FechaEmision: fechaEmision,
      Emisor: emisor,
      CondicionVenta: condicionVenta,
      DetalleServicio: { LineaDetalle: lineaDetalle },
      ResumenFactura: {
        MedioPago: medioPago,
        TotalVenta: totalVenta.toFixed(5),
        TotalVentaNeta: totalVentaNeta.toFixed(5),
        TotalImpuesto: totalImpuesto.toFixed(5),
        TotalComprobante: totalVenta.toFixed(5),
      },
    };

    if (receptor) facturaElectronica.Receptor = receptor;
    if (entry.crPlazoCredito !== undefined) {
      facturaElectronica.PlazoCredito = entry.crPlazoCredito;
    }

    return {
      invoice: {
        fe_version: "4.4",
        FacturaElectronica: facturaElectronica,
      },
      certificate: settings.certificateBase64 ?? "",
      token_user_name: settings.haciendaUsername ?? "",
    };
  }

  private formatFechaEmision(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}-06:00`;
  }
}

export const crEinvoiceJsonBuilderService = new CrEinvoiceJsonBuilderService();
