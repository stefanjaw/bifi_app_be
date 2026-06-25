import puppeteer from "puppeteer";
import {
  CHROMIUM_EXECUTABLE,
  getLaunchArgs,
} from "../../../system/libraries/pdf";
import { CrEinvoiceSettingsDocument } from "../settings/models/cr-einvoice-settings.model";

export class CrEinvoicePdfService {
  async generateBase64(
    entry: any,
    settings: CrEinvoiceSettingsDocument,
  ): Promise<string> {
    const html = this.buildHtml(entry, settings);

    const browser = await puppeteer.launch({
      executablePath: CHROMIUM_EXECUTABLE,
      args: getLaunchArgs(),
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const buffer = await page.pdf({ format: "A4", printBackground: true });
      return Buffer.from(buffer).toString("base64");
    } finally {
      await browser.close();
    }
  }

  private buildHtml(entry: any, settings: CrEinvoiceSettingsDocument): string {
    const emisorCompany = (settings as any).emisorCompanyId as any;
    const emisorContact = emisorCompany?.contactId as any;
    const emisorNombre =
      emisorContact?.commercialName ||
      emisorContact?.name ||
      emisorCompany?.name ||
      "";
    const emisorVat = (emisorContact?.vat ?? "").replace(/\D/g, "");
    const emisorEmail = emisorContact?.email ?? "";
    const emisorTel = emisorContact?.phoneNumber ?? "";
    const emisorDir = [
      emisorContact?.streetAddress,
      emisorContact?.city,
      emisorContact?.state,
    ]
      .filter(Boolean)
      .join(", ");

    const contactData = entry.contactId as any;
    const receptorNombre = contactData
      ? `${contactData.name ?? ""} ${contactData.lastName ?? ""}`.trim()
      : "";
    const receptorVat = contactData?.vat ?? "";
    const receptorEmail = contactData?.email ?? "";
    const receptorDir = [
      contactData?.streetAddress,
      contactData?.city,
      contactData?.state,
    ]
      .filter(Boolean)
      .join(", ");

    const consecutivo = entry.crNumeroConsecutivo ?? "";
    const clave = entry.crClave ?? "";
    const fecha =
      entry.crFechaEmision ?? entry.date
        ? new Date(entry.crFechaEmision ?? entry.date).toLocaleDateString(
            "es-CR",
          )
        : "";

    const currency = (entry.currencyId as any)?.code ?? "CRC";

    const productLines = (entry.lines ?? []).filter(
      (l: any) => !l.lineType || l.lineType === "product",
    );

    let lineRows = "";
    for (const line of productLines) {
      const qty = line.quantity ?? 1;
      const price = line.unitPrice ?? 0;
      const sub = qty * price;
      const taxes: any[] = (line.taxIds ?? []).filter(
        (t: any) => t && typeof t === "object" && t._id && t.crCodigo,
      );
      const firstTax = taxes[0] ?? null;
      const tarifa = firstTax
        ? firstTax.crTarifa ?? firstTax.percentage ?? 0
        : 0;
      const taxAmount = firstTax ? (sub * tarifa) / 100 : 0;
      const total = sub + taxAmount;
      const taxLabel = firstTax ? `IVA ${tarifa}%` : "";

      lineRows += `
        <tr>
          <td>${line.description ?? ""}</td>
          <td class="num">${qty.toFixed(3)}</td>
          <td class="num">${price.toFixed(5)}</td>
          <td class="num">${sub.toFixed(5)}</td>
          <td class="num">${taxLabel}</td>
          <td class="num">${taxAmount.toFixed(5)}</td>
          <td class="num">${total.toFixed(5)}</td>
        </tr>`;
    }

    const subTotal: number = entry.untaxedAmount ?? 0;
    const taxTotal: number = entry.taxAmount ?? 0;
    const grandTotal = subTotal + taxTotal;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #222; margin: 30px; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 0 0 2px; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 16px; }
  .header-left { max-width: 60%; }
  .header-right { text-align: right; }
  .parties { display: flex; gap: 40px; margin-bottom: 16px; }
  .party { flex: 1; background: #f9f9f9; padding: 8px 12px; border-radius: 4px; }
  .party h2 { border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #2c3e50; color: #fff; padding: 5px 8px; text-align: left; font-size: 10px; }
  td { padding: 4px 8px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f5f5f5; }
  .num { text-align: right; }
  .totals { float: right; width: 280px; }
  .totals table { font-size: 11px; }
  .totals td { padding: 3px 8px; }
  .totals .grand td { font-weight: bold; font-size: 13px; background: #ecf0f1; }
  .clave { font-size: 9px; color: #666; word-break: break-all; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 8px; }
  .clearfix::after { content: ""; display: table; clear: both; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${emisorNombre}</h1>
      <div>Cédula: ${emisorVat}</div>
      ${emisorDir ? `<div>${emisorDir}</div>` : ""}
      ${emisorTel ? `<div>Tel: ${emisorTel}</div>` : ""}
      ${emisorEmail ? `<div>${emisorEmail}</div>` : ""}
    </div>
    <div class="header-right">
      <h1>FACTURA ELECTRÓNICA</h1>
      <div><strong>Consecutivo:</strong> ${consecutivo}</div>
      <div><strong>Fecha:</strong> ${fecha}</div>
      <div><strong>Moneda:</strong> ${currency}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h2>Emisor</h2>
      <div>${emisorNombre}</div>
      <div>Cédula: ${emisorVat}</div>
      ${emisorDir ? `<div>${emisorDir}</div>` : ""}
    </div>
    <div class="party">
      <h2>Receptor</h2>
      <div>${receptorNombre}</div>
      ${receptorVat ? `<div>Cédula: ${receptorVat}</div>` : ""}
      ${receptorDir ? `<div>${receptorDir}</div>` : ""}
      ${receptorEmail ? `<div>${receptorEmail}</div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th class="num">Cantidad</th>
        <th class="num">Precio Unit.</th>
        <th class="num">SubTotal</th>
        <th class="num">Impuesto</th>
        <th class="num">Monto Imp.</th>
        <th class="num">Total Línea</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="clearfix">
    <div class="totals">
      <table>
        <tr><td>SubTotal</td><td class="num">${currency} ${subTotal.toFixed(
      5,
    )}</td></tr>
        <tr><td>Impuestos</td><td class="num">${currency} ${taxTotal.toFixed(
      5,
    )}</td></tr>
        <tr class="grand"><td>TOTAL</td><td class="num">${currency} ${grandTotal.toFixed(
      5,
    )}</td></tr>
      </table>
    </div>
  </div>

  <div class="clave">Clave: ${clave}</div>
</body>
</html>`;
  }
}

export const crEinvoicePdfService = new CrEinvoicePdfService();
