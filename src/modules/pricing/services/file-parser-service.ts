import * as XLSX from "xlsx";

export interface CatalogRecord {
  product_name?: string;
  part_number?: string;
  supplier?: string;
  unit_price?: number;
  currency?: string;
  price_break_qty?: number;
  source_file?: string;
  file_date?: Date;
  last_indexed?: Date;
  folderId?: string;
}

export interface FreightRecord {
  rate_type?: string;
  carrier?: string;
  service?: string;
  zone?: string;
  weight_min_lb?: number;
  weight_max_lb?: number;
  rate_usd?: number;
  unit?: string;
  origin?: string;
  destination?: string;
  effective_date?: Date;
  hs_code?: string;
  duty_rate_pct?: number;
  product_description?: string;
  source_file?: string;
  folderId?: string;
}

export class FileParserService {
  catalogRecordsToCsv(records: CatalogRecord[]): Buffer {
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalog");
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "csv" }));
  }

  freightRecordsToCsv(records: FreightRecord[]): Buffer {
    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Freight");
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "csv" }));
  }
}
