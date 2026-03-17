import { PaginateModel } from "mongoose";
import { ConnectionManager } from "../../../system/libraries/base-module/connection-manager";
import { freightCacheModel, FreightCacheDocument } from "../models/freight-cache.model";
import { freightRecordGenAISchema } from "../models/freight-record.schema";
import { GemsService } from "../../ai/gems/services/gems-service";
import { GoogleDriveConnectorService } from "../../../system";
import { FreightRecord, FileParserService } from "./file-parser-service";
import { DriveFileService, FilePart } from "./drive-file-service";
import { toErrorMessage } from "../utils/error-utils";

export interface FreightIndexResult {
  records: FreightRecord[];
  filesProcessed: number;
  errors: string[];
  uploadWarning?: string;
}

type FolderRef = { folderId: string; label?: string };

export class FreightIndexer {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly fileParserService: FileParserService,
    private readonly driveFileService: DriveFileService,
  ) {}

  private getModel(): PaginateModel<FreightCacheDocument> {
    return this.connectionManager.bindModelToDb(freightCacheModel);
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
    freightFolders: FolderRef[],
    configFolderId: string,
    lastIndexed?: Date,
  ): Promise<FreightIndexResult> {
    const allFileParts: (FilePart & { folderId: string })[] = [];
    const errors: string[] = [];
    let filesProcessed = 0;

    for (const folder of freightFolders) {
      try {
        const downloaded = await this.driveFileService.downloadFolderFiles(
          folder.folderId,
          driveConnector,
          lastIndexed,
        );
        for (const entry of downloaded.files) {
          allFileParts.push({ ...entry, folderId: folder.folderId });
        }
        filesProcessed += downloaded.files.length;
        errors.push(...downloaded.errors);
      } catch (err: unknown) {
        errors.push(`Freight folder ${folder.label || folder.folderId}: ${toErrorMessage(err)}`);
      }
    }

    let records: FreightRecord[] = [];

    if (allFileParts.length > 0) {
      try {
        console.log(`Extracting freight records from ${allFileParts.length} file(s)...`);
        const extracted = await this.extractBatch(gemsService, allFileParts);
        const filePartMap = new Map(allFileParts.map((fp) => [fp.file.name, fp.folderId]));

        let accepted = 0;
        let rejected = 0;
        for (const record of extracted) {
          if (record.carrier || record.rate_usd != null || record.rate_type || record.hs_code || record.duty_rate_pct != null) {
            record.folderId = record.source_file ? filePartMap.get(record.source_file) : undefined;
            records.push(record);
            accepted++;
          } else {
            rejected++;
          }
        }

        if (rejected > 0) {
          console.log(`Freight validity filter: ${accepted} accepted, ${rejected} rejected out of ${extracted.length}`);
        }
      } catch (err: unknown) {
        errors.push(`Gems freight extraction: ${toErrorMessage(err)}`);
      }
    }

    if (records.length > 0) {
      await this.upsertCache(records);
    }

    let uploadWarning: string | undefined;
    try {
      const fullFreight = await this.getAllActiveRecords();
      if (fullFreight.length > 0) {
        const csvBuffer = this.fileParserService.freightRecordsToCsv(fullFreight);
        await driveConnector.uploadFile(configFolderId, "freight_index.csv", csvBuffer);
      }
    } catch (err: unknown) {
      uploadWarning = `Upload freight_index.csv: ${toErrorMessage(err)}`;
    }

    return { records, filesProcessed, errors, uploadWarning };
  }

  private recoverTruncatedJson(raw: string): unknown[] {
    const text = raw.trim();
    if (!text.startsWith("[")) return [];

    let depth = 0;
    let inString = false;
    let escape = false;
    let lastCompleteItem = -1;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "[" || ch === "{") depth++;
      if (ch === "]" || ch === "}") depth--;
      if (ch === "}" && depth === 1) lastCompleteItem = i;
    }

    if (lastCompleteItem > 0) {
      try {
        const parsed = JSON.parse(text.substring(0, lastCompleteItem + 1) + "]");
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    }
    return [];
  }

  private async extractFromFile(gemsService: GemsService, entry: FilePart): Promise<FreightRecord[]> {
    const response = await gemsService.generate({
      question:
        "Extract all freight, shipping, and customs tariff records from the attached file. " +
        "The file may contain EITHER shipping rate tables (carrier rates) OR customs tariff / duty schedules, or both. " +
        "For shipping rate entries: extract the rate type or mode, carrier name, service level, " +
        "zone, weight range (min and max in pounds), rate amount in USD, unit of measure, " +
        "origin, destination, and effective date. " +
        "For customs tariff / duty schedule entries: extract the HS tariff code (hs_code), " +
        "product or commodity description (product_description), duty rate as a percentage number (duty_rate_pct), " +
        "and effective date. " +
        `Set source_file to "${entry.file.name}" for every record. ` +
        "Return every row/entry you can find. If a field is not present, return null for it.",
      promptParts: [entry.part],
      schema: freightRecordGenAISchema,
      maxOutputTokens: 65536,
    });

    const rawText = response.text ?? "[]";
    let records: FreightRecord[];
    try {
      const parsed = JSON.parse(rawText);
      records = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      const recovered = this.recoverTruncatedJson(rawText) as FreightRecord[];
      if (recovered.length > 0) {
        console.log(`Freight: recovered ${recovered.length} records from truncated response for "${entry.file.name}"`);
      }
      records = recovered;
    }

    console.log(`Freight: extracted ${records.length} records from "${entry.file.name}"`);

    return records.map((r) => ({
      ...r,
      effective_date: r.effective_date ? new Date(r.effective_date as unknown as string) : undefined,
      source_file: r.source_file || entry.file.name,
    }));
  }

  private async extractBatch(gemsService: GemsService, files: FilePart[]): Promise<FreightRecord[]> {
    const allRecords: FreightRecord[] = [];
    for (const entry of files) {
      try {
        const records = await this.extractFromFile(gemsService, entry);
        allRecords.push(...records);
      } catch (err: unknown) {
        console.error(`Freight extraction failed for "${entry.file.name}": ${toErrorMessage(err)}`);
      }
    }
    return allRecords;
  }

  private async upsertCache(records: FreightRecord[]): Promise<void> {
    const model = this.getModel();
    const sourceFiles = [...new Set(records.map((r) => r.source_file).filter(Boolean))];
    if (sourceFiles.length > 0) {
      await model.deleteMany({ source_file: { $in: sourceFiles } });
    }
    await model.insertMany(records.map((r) => ({ ...r, active: true })));
  }

  async getAllActiveRecords(): Promise<FreightRecord[]> {
    const docs = await this.getModel().find({ active: true }).lean();
    return docs.map((d) => ({
      rate_type: d.rate_type ?? undefined,
      carrier: d.carrier ?? undefined,
      service: d.service ?? undefined,
      zone: d.zone ?? undefined,
      weight_min_lb: d.weight_min_lb ?? undefined,
      weight_max_lb: d.weight_max_lb ?? undefined,
      rate_usd: d.rate_usd ?? undefined,
      unit: d.unit ?? undefined,
      origin: d.origin ?? undefined,
      destination: d.destination ?? undefined,
      effective_date: d.effective_date ?? undefined,
      hs_code: d.hs_code ?? undefined,
      duty_rate_pct: d.duty_rate_pct ?? undefined,
      product_description: d.product_description ?? undefined,
      source_file: d.source_file ?? undefined,
      folderId: d.folderId ?? undefined,
    }));
  }
}
