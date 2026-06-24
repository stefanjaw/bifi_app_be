import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import { existsSync, readdirSync } from "fs";
import * as nodePath from "path";

function resolveChromiumPath(): string {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  for (const dir of (process.env.PATH || "").split(":")) {
    const p = nodePath.join(dir, "chromium");
    if (existsSync(p)) return p;
  }
  try {
    const entries = readdirSync("/nix/store");
    const found = entries.find((e) => /-chromium-/.test(e));
    if (found) return `/nix/store/${found}/bin/chromium`;
  } catch {}
  throw new Error("Chromium not found. Install via Nix or set CHROMIUM_PATH.");
}

const CHROMIUM_EXECUTABLE = resolveChromiumPath();

function esc(value: unknown): string {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmt(value: number | undefined | null): string {
  return (value ?? 0).toFixed(2);
}

function fmtDate(value: any): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export class PurchaseOrderPdfService {
  async generate(order: any): Promise<Buffer> {
    const html = this.buildHtml(order);

    const browser = await puppeteer.launch({
      executablePath: CHROMIUM_EXECUTABLE,
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "30px", bottom: "30px", left: "30px", right: "30px" },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildHtml(order: any): string {
    const contact = order.contactId ?? {};
    const firstName = contact.name ?? "";
    const lastName = contact.lastName ?? "";
    const supplierName = (contact.fullName ?? `${firstName} ${lastName}`.trim()) || "—";
    const supplierEmail = contact.email ?? "";
    const supplierPhone = contact.phoneNumber ?? "";

    const statusLabel = this.formatStatus(order.status ?? "draft");
    const lineItems: any[] = order.lineItems ?? [];
    const taxes: any[] = order.taxes ?? [];

    const lineRows = lineItems
      .map((item: any) => {
        const discount = item.discountId;
        const discountLabel = discount
          ? discount.discountType === "percentage"
            ? `${discount.name} (${discount.value}%)`
            : `${discount.name} (−${fmt(discount.value)})`
          : "—";
        return `
        <tr>
          <td class="left">${esc(item.description || (item.productId?.name ?? ""))}</td>
          <td class="right">${esc(item.quantity ?? 0)}</td>
          <td class="right">${fmt(item.unitPrice)}</td>
          <td class="left">${esc(discountLabel)}</td>
          <td class="right">${fmt(item.total)}</td>
        </tr>`;
      })
      .join("");

    const taxRows = taxes
      .map(
        (t: any) => `
      <div class="totals-row">
        <span>Tax</span>
        <span>${fmt(t.amount)}</span>
      </div>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 40px; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
    .doc-title { font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    .doc-number { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .meta-block h3 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
    .meta-block p { font-size: 12px; color: #111827; line-height: 1.6; }
    .meta-block .label { font-size: 10px; color: #6b7280; }

    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
    thead tr { background: #f8fafc; }
    th { padding: 8px 10px; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: top; }
    tbody tr:last-child td { border-bottom: none; }
    .left { text-align: left; }
    .right { text-align: right; }

    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-box { min-width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #6b7280; border-bottom: 1px solid #f3f4f6; }
    .totals-row.grand { font-size: 14px; font-weight: 700; color: #111827; border-top: 2px solid #2563eb; border-bottom: none; padding-top: 8px; margin-top: 4px; }

    .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; font-size: 10px; color: #6b7280; line-height: 1.6; white-space: pre-wrap; }

    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="doc-title">PURCHASE ORDER</div>
      <div class="doc-number">${esc(order.poNumber ?? "—")}</div>
    </div>
    <div style="text-align:right;">
      <div class="status-badge">${esc(statusLabel)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-block">
      <h3>Supplier</h3>
      <p>${esc(supplierName)}</p>
      ${supplierEmail ? `<p class="label">${esc(supplierEmail)}</p>` : ""}
      ${supplierPhone ? `<p class="label">${esc(supplierPhone)}</p>` : ""}
    </div>
    <div class="meta-block">
      <h3>Dates</h3>
      <p><span class="label">Issue Date:</span> ${esc(fmtDate(order.issueDate))}</p>
      ${order.expectedDeliveryDate ? `<p><span class="label">Expected Delivery:</span> ${esc(fmtDate(order.expectedDeliveryDate))}</p>` : ""}
    </div>
  </div>

  <div class="section-title">Line Items</div>
  <table>
    <thead>
      <tr>
        <th class="left" style="width:40%">Description</th>
        <th class="right" style="width:10%">Qty</th>
        <th class="right" style="width:15%">Unit Price</th>
        <th class="left" style="width:20%">Discount</th>
        <th class="right" style="width:15%">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px;">No line items</td></tr>'}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${fmt(order.subtotal)}</span>
      </div>
      ${taxRows}
      <div class="totals-row">
        <span>Tax Total</span>
        <span>${fmt(order.taxTotal)}</span>
      </div>
      <div class="totals-row grand">
        <span>Grand Total</span>
        <span>${fmt(order.grandTotal)}</span>
      </div>
    </div>
  </div>

  ${
    order.notes
      ? `<div class="section-title">Notes</div>
  <div class="notes-box">${esc(order.notes)}</div>`
      : ""
  }

  <div class="footer">
    Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
  </div>

</body>
</html>`;
  }

  private formatStatus(status: string): string {
    const map: Record<string, string> = {
      draft: "Draft",
      confirmed: "Confirmed",
      sent: "Sent",
      partially_received: "Partially Received",
      received: "Received",
      cancelled: "Cancelled",
    };
    return map[status] ?? status;
  }
}
