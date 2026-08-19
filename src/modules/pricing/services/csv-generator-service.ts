import { json2csv } from "json-2-csv";
import { PricingEstimateDocument } from "../models/pricing-estimate.model";

export class CsvGeneratorService {
  generate(estimate: PricingEstimateDocument): Buffer {
    const lineItems = estimate.lineItems ?? [];

    const rows = lineItems.map((item) => ({
      "Estimate #": estimate.number ?? "",
      Date: estimate.date
        ? new Date(estimate.date).toISOString().split("T")[0]
        : "",
      "Prepared By": estimate.preparedBy ?? "",
      Product: item.product ?? "",
      Supplier: item.supplier ?? "",
      "Part No": item.partNo ?? "",
      Qty: item.qty ?? 0,
      "Unit Price": item.unitPrice ?? 0,
      "Freight/Unit": item.freightPerUnit ?? 0,
      "HS Code": item.hsCode ?? "",
      "Duty %": item.dutyPct ?? 0,
      "Duty/Unit": item.dutyPerUnit ?? 0,
      Wharfage: item.wharfage ?? 0,
      "Landed/Unit": item.landedPerUnit ?? 0,
      "Cust Price/Unit": item.custPricePerUnit ?? 0,
      "Margin %": item.marginPct ?? 0,
      "Total Customer": item.totalCust ?? 0,
    }));

    if (rows.length === 0) {
      rows.push({
        "Estimate #": estimate.number ?? "",
        Date: estimate.date
          ? new Date(estimate.date).toISOString().split("T")[0]
          : "",
        "Prepared By": estimate.preparedBy ?? "",
        Product: "",
        Supplier: "",
        "Part No": "",
        Qty: 0,
        "Unit Price": 0,
        "Freight/Unit": 0,
        "HS Code": "",
        "Duty %": 0,
        "Duty/Unit": 0,
        Wharfage: 0,
        "Landed/Unit": 0,
        "Cust Price/Unit": 0,
        "Margin %": 0,
        "Total Customer": 0,
      });
    }

    const csv = json2csv(rows, { preventCsvInjection: true });
    return Buffer.from(csv, "utf-8");
  }
}
