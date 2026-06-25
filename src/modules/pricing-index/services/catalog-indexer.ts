import { PaginateModel } from "mongoose";
import { ConnectionManager } from "../../../system/libraries/base-module/connection-manager";
import {
  catalogCacheModel,
  CatalogCacheDocument,
} from "../models/catalog-cache.model";
import { catalogRecordGenAISchema } from "../models/catalog-record.schema";
import { GemsService } from "../../ai/gems/services/gems-service";
import { GoogleDriveConnectorService } from "../../../system";
import { CatalogRecord, FileParserService } from "./file-parser-service";
import { DriveFileService, FilePart } from "./drive-file-service";
import { toErrorMessage } from "../utils/error-utils";

export interface CatalogIndexResult {
  records: CatalogRecord[];
  filesProcessed: number;
  errors: string[];
  uploadWarning?: string;
}

type FolderRef = { folderId: string; label?: string };

export class CatalogIndexer {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly fileParserService: FileParserService,
    private readonly driveFileService: DriveFileService
  ) {}

  private getModel(): PaginateModel<CatalogCacheDocument> {
    return this.connectionManager.bindModelToDb(catalogCacheModel);
  }

  async getActiveRecordCount(): Promise<number> {
    try {
      return await this.getModel().countDocuments({ active: true });
    } catch {
      return 0;
    }
  }

  async index(
    gemsService: GemsService,
    driveConnector: GoogleDriveConnectorService,
    pricingFolders: FolderRef[],
    configFolderId: string,
    lastIndexed?: Date
  ): Promise<CatalogIndexResult> {
    const allFileParts: (FilePart & { folderId: string })[] = [];
    const errors: string[] = [];
    let filesProcessed = 0;

    for (const folder of pricingFolders) {
      try {
        const downloaded = await this.driveFileService.downloadFolderFiles(
          folder.folderId,
          driveConnector,
          lastIndexed
        );
        for (const entry of downloaded.files) {
          allFileParts.push({ ...entry, folderId: folder.folderId });
        }
        filesProcessed += downloaded.files.length;
        errors.push(...downloaded.errors);
      } catch (err: unknown) {
        errors.push(
          `Pricing folder ${folder.label || folder.folderId}: ${toErrorMessage(
            err
          )}`
        );
      }
    }

    let records: CatalogRecord[] = [];

    if (allFileParts.length > 0) {
      try {
        console.log(
          `Extracting catalog records from ${allFileParts.length} file(s)...`
        );
        const extracted = await this.extractBatch(gemsService, allFileParts);
        const filePartMap = new Map(
          allFileParts.map((fp) => [fp.file.name, fp.folderId])
        );
        for (const record of extracted) {
          if (record.product_name || record.part_number) {
            record.folderId = record.source_file
              ? filePartMap.get(record.source_file)
              : undefined;
            records.push(record);
          }
        }
      } catch (err: unknown) {
        errors.push(`Gems catalog extraction: ${toErrorMessage(err)}`);
      }
    }

    if (records.length > 0) {
      await this.upsertCache(records);
    }

    let uploadWarning: string | undefined;
    try {
      const fullCatalog = await this.getAllActiveRecords();
      if (fullCatalog.length > 0) {
        const csvBuffer =
          this.fileParserService.catalogRecordsToCsv(fullCatalog);
        await driveConnector.uploadFile(
          configFolderId,
          "master_catalog.csv",
          csvBuffer
        );
      }
    } catch (err: unknown) {
      uploadWarning = `Upload master_catalog.csv: ${toErrorMessage(err)}`;
    }

    return { records, filesProcessed, errors, uploadWarning };
  }

  private async extractBatch(
    gemsService: GemsService,
    files: (FilePart & { folderId: string })[]
  ): Promise<CatalogRecord[]> {
    const promptParts = this.driveFileService.buildLabeledParts(files);

    const response = await gemsService.generate({
      question:
        "Extract all product catalog records from ALL the attached files. " +
        "Each file is preceded by a label like === FILE: filename.pdf ===. " +
        "For each product found, extract the product name or description, part number or SKU, " +
        "supplier or vendor name, unit price, currency, minimum order or price-break quantity, " +
        "and set source_file to the filename from the label preceding that file. " +
        "Return every row/item you can find across all files combined. If a field is not present, return null for it.",
      promptParts,
      schema: catalogRecordGenAISchema,
      maxOutputTokens: 65536,
    });

    let records: CatalogRecord[] = [];
    try {
      const parsed = JSON.parse(response.text ?? "[]");
      records = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }

    const fileDateMap = new Map(files.map((f) => [f.file.name, f.fileDate]));
    return records.map((r) => ({
      ...r,
      source_file: r.source_file || undefined,
      file_date:
        (r.source_file ? fileDateMap.get(r.source_file) : undefined) ||
        undefined,
      last_indexed: new Date(),
    }));
  }

  private async upsertCache(records: CatalogRecord[]): Promise<void> {
    const model = this.getModel();
    const sourceFiles = [
      ...new Set(records.map((r) => r.source_file).filter(Boolean)),
    ];
    if (sourceFiles.length > 0) {
      await model.deleteMany({ source_file: { $in: sourceFiles } });
    }
    await model.insertMany(records.map((r) => ({ ...r, active: true })));
  }

  async getAllActiveRecords(): Promise<CatalogRecord[]> {
    const docs = await this.getModel().find({ active: true }).lean();
    return docs.map((d) => ({
      product_name: d.product_name ?? undefined,
      part_number: d.part_number ?? undefined,
      supplier: d.supplier ?? undefined,
      unit_price: d.unit_price ?? undefined,
      currency: d.currency ?? undefined,
      price_break_qty: d.price_break_qty ?? undefined,
      source_file: d.source_file ?? undefined,
      file_date: d.file_date ?? undefined,
      last_indexed: d.last_indexed ?? undefined,
      folderId: d.folderId ?? undefined,
    }));
  }
}
