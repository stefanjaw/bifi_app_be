import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import { existsSync, readdirSync } from "fs";
import * as nodePath from "path";
import {
  PricingEstimateDocument,
  PricingEstimateLineItemDocument,
} from "@mongodb-types";

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

export class PdfGeneratorService {
  async generate(estimate: PricingEstimateDocument): Promise<Buffer> {
    const html = this.buildHtml(estimate);

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
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildHtml(estimate: PricingEstimateDocument): string {
    const lineItems = estimate.lineItems ?? [];
    const date = estimate.date
      ? new Date(estimate.date).toLocaleDateString()
      : "N/A";

    const pricingControls = estimate.pricingControls;

    const lineItemRows = lineItems
      .map(
        (item: PricingEstimateLineItemDocument) => `
      <tr>
        <td class="left">${esc(item.product)}</td>
        <td class="left">${esc(item.supplier)}</td>
        <td>${esc(item.partNo)}</td>
        <td>${item.qty ?? 0}</td>
        <td>${(item.unitPrice ?? 0).toFixed(2)}</td>
        <td>${(item.freightPerUnit ?? 0).toFixed(2)}</td>
        <td>${esc(item.hsCode)}</td>
        <td>${(item.dutyPct ?? 0).toFixed(1)}%</td>
        <td>${(item.dutyPerUnit ?? 0).toFixed(2)}</td>
        <td>${(item.wharfage ?? 0).toFixed(2)}</td>
        <td>${(item.landedPerUnit ?? 0).toFixed(2)}</td>
        <td>${(item.custPricePerUnit ?? 0).toFixed(2)}</td>
        <td>${(item.marginPct ?? 0).toFixed(1)}%</td>
        <td>${(item.totalCust ?? 0).toFixed(2)}</td>
      </tr>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #222; padding: 30px; }
    h1 { font-size: 18px; text-align: center; margin-bottom: 6px; }
    .meta { display: flex; flex-wrap: wrap; gap: 4px 24px; margin-bottom: 14px; font-size: 10px; }
    .meta span { white-space: nowrap; }
    .meta .label { font-weight: 600; }
    .section-title { font-size: 12px; font-weight: 700; margin: 14px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
    .request-text { background: #f7f7f7; padding: 8px; border-radius: 4px; margin-bottom: 10px; white-space: pre-wrap; font-size: 9px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 8px; }
    th, td { border: 1px solid #ddd; padding: 3px 5px; text-align: right; }
    th { background: #f0f0f0; font-weight: 600; }
    td.left, th.left { text-align: left; }
    .totals { font-size: 11px; margin-bottom: 10px; }
    .totals .row { display: flex; justify-content: space-between; max-width: 350px; padding: 2px 0; }
    .totals .row.bold { font-weight: 700; }
    .ai-usage { font-size: 9px; margin-bottom: 12px; }
    .ai-usage span { margin-right: 16px; }
    .disclaimer { font-size: 8px; color: #666; font-style: italic; margin-top: 16px; border-top: 1px solid #ccc; padding-top: 8px; }
    .controls { font-size: 9px; margin-bottom: 10px; }
    .controls span { margin-right: 16px; }
  </style>
</head>
<body>
  <h1>Estimated Price &amp; Landed Cost</h1>

  <div class="meta">
    <span><span class="label">Estimate #:</span> ${esc(
      estimate.number ?? "N/A",
    )}</span>
    <span><span class="label">Date:</span> ${esc(date)}</span>
    <span><span class="label">Prepared By:</span> ${esc(
      estimate.preparedBy ?? "N/A",
    )}</span>
    <span><span class="label">Shipping:</span> ${esc(
      estimate.shippingMethod ?? "N/A",
    )}</span>
    <span><span class="label">Status:</span> ${esc(
      estimate.status ?? "draft",
    )}</span>
  </div>

  ${
    pricingControls
      ? `<div class="controls">
    <span><strong>Method:</strong> ${esc(
      pricingControls.method ?? "markup",
    )}</span>
    <span><strong>Markup Factor:</strong> ${esc(
      pricingControls.markupFactor ?? "N/A",
    )}</span>
    <span><strong>Margin:</strong> ${esc(
      pricingControls.margin ?? "N/A",
    )}%</span>
    <span><strong>Duty Free:</strong> ${
      pricingControls.dutyFree ? "Yes" : "No"
    }</span>
  </div>`
      : ""
  }

  ${
    estimate.requestText
      ? `<div class="section-title">Request</div>
  <div class="request-text">${esc(estimate.requestText)}</div>`
      : ""
  }

  ${
    estimate.specialInstructions
      ? `<div class="section-title">Special Instructions</div>
  <div class="request-text">${esc(estimate.specialInstructions)}</div>`
      : ""
  }

  <div class="section-title">Line Items</div>
  <table>
    <thead>
      <tr>
        <th class="left">Product</th>
        <th class="left">Supplier</th>
        <th>Part #</th>
        <th>Qty</th>
        <th>Unit $</th>
        <th>Freight $</th>
        <th>HS Code</th>
        <th>Duty %</th>
        <th>Duty $</th>
        <th>Wharf $</th>
        <th>Landed $</th>
        <th>Cust $</th>
        <th>Margin %</th>
        <th>Total $</th>
      </tr>
    </thead>
    <tbody>
      ${
        lineItemRows ||
        '<tr><td colspan="14" style="text-align:center;">No line items</td></tr>'
      }
    </tbody>
  </table>

  <div class="totals">
    <div class="row bold"><span>Total Landed Cost:</span><span>$${(
      estimate.totalLanded ?? 0
    ).toFixed(2)}</span></div>
    <div class="row bold"><span>Total Customer Price:</span><span>$${(
      estimate.totalCustomer ?? 0
    ).toFixed(2)}</span></div>
    <div class="row"><span>Wharfage / Bank Fee (${
      estimate.wharfageBankFeePct ?? 0
    }%):</span><span>$${(estimate.wharfageBankFeeAmount ?? 0).toFixed(
      2,
    )}</span></div>
  </div>

  <div class="section-title">AI Usage</div>
  <div class="ai-usage">
    <span><strong>Model:</strong> ${esc(estimate.aiModel ?? "N/A")}</span>
    <span><strong>Input:</strong> ${estimate.inputTokens ?? 0}</span>
    <span><strong>Output:</strong> ${estimate.outputTokens ?? 0}</span>
    <span><strong>Total Tokens:</strong> ${estimate.totalTokens ?? 0}</span>
    <span><strong>Est. Cost:</strong> $${(estimate.estimatedCost ?? 0).toFixed(
      4,
    )}</span>
  </div>

  <div class="disclaimer">
    Disclaimer: This estimate is generated using AI-powered analysis of indexed pricing data.
    Actual prices, duties, and freight rates may vary. This document is for estimation purposes only
    and does not constitute a binding quotation.
  </div>
</body>
</html>`;
  }
}
