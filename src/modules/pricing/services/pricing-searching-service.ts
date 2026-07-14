import { ConnectionManager } from "../../../system/libraries/base-module/connection-manager";
import { DriveSettingsService } from "../../drive-settings/services/drive-settings-service";
import { PricingSettingsService } from "./pricing-settings-service";
import { AiSettingsService } from "../../ai/services/ai-settings-service";
import {
  GoogleDriveConnectorService,
  ValidationException,
} from "../../../system";
import { GemsService } from "../../ai/services/gems-service";
import { FileParserService } from "./file-parser-service";
import { DriveFileService } from "./drive-file-service";
import { CatalogIndexer } from "./catalog-indexer";
import { FreightIndexer } from "./freight-indexer";
import { toErrorMessage } from "../utils/error-utils";

export interface IndexingSummary {
  filesProcessed: number;
  catalogRecords: number;
  freightRecords: number;
  suppliersFound: string[];
  freightTypesFound: string[];
  lastIndexedAt: Date;
  errors: string[];
}

type IndexType = "pricing" | "freight" | "all";

export class PricingIndexingService {
  private readonly connectionManager: ConnectionManager;
  private readonly driveSettingsService: DriveSettingsService;
  private readonly pricingSettingsService: PricingSettingsService;
  private readonly aiSettingsService: AiSettingsService;
  private readonly catalogIndexer: CatalogIndexer;
  private readonly freightIndexer: FreightIndexer;

  private static scheduledInterval: ReturnType<typeof setInterval> | null =
    null;
  private static isRunning = false;
  private static lastResult: IndexingSummary | null = null;

  constructor(
    connectionManager = new ConnectionManager(),
    driveSettingsService = new DriveSettingsService(),
    pricingSettingsService = new PricingSettingsService(),
    aiSettingsService = new AiSettingsService(),
  ) {
    this.connectionManager = connectionManager;
    this.driveSettingsService = driveSettingsService;
    this.pricingSettingsService = pricingSettingsService;
    this.aiSettingsService = aiSettingsService;

    const fileParserService = new FileParserService();
    const driveFileService = new DriveFileService();
    this.catalogIndexer = new CatalogIndexer(
      this.connectionManager,
      fileParserService,
      driveFileService,
    );
    this.freightIndexer = new FreightIndexer(
      this.connectionManager,
      fileParserService,
      driveFileService,
    );
  }

  private async createGemsService(): Promise<GemsService> {
    const aiSettings = await this.aiSettingsService.getSettings();
    if (!aiSettings?.apiKey) {
      throw new ValidationException(
        "AI settings not configured. Please add an API key in AI Settings.",
      );
    }
    return new GemsService({
      apiKey: aiSettings.apiKey,
      model: aiSettings.model,
      embeddingModel: aiSettings.embeddingModel,
    });
  }

  async triggerIndexing(
    type?: IndexType,
    force?: boolean,
  ): Promise<IndexingSummary> {
    if (PricingIndexingService.isRunning) {
      return {
        filesProcessed: 0,
        catalogRecords: 0,
        freightRecords: 0,
        suppliersFound: [],
        freightTypesFound: [],
        lastIndexedAt: new Date(),
        errors: ["Indexing is already in progress."],
      };
    }

    PricingIndexingService.isRunning = true;
    try {
      const result = await this.runIndexing(type, force);
      PricingIndexingService.lastResult = result;
      return result;
    } catch (err: unknown) {
      const failResult: IndexingSummary = {
        filesProcessed: 0,
        catalogRecords: 0,
        freightRecords: 0,
        suppliersFound: [],
        freightTypesFound: [],
        lastIndexedAt: new Date(),
        errors: [toErrorMessage(err)],
      };
      PricingIndexingService.lastResult = failResult;
      return failResult;
    } finally {
      PricingIndexingService.isRunning = false;
    }
  }

  private async runIndexing(
    type?: IndexType,
    force?: boolean,
  ): Promise<IndexingSummary> {
    const driveSettings = await this.driveSettingsService.getSettings();
    if (!driveSettings?.serviceAccountKey) {
      throw new ValidationException(
        "Google Drive settings not configured. Please add a service account key.",
      );
    }

    const pricingSettings = await this.pricingSettingsService.getSettings();
    const folders = pricingSettings?.folders ?? [];

    if (folders.length === 0) {
      throw new ValidationException(
        "No folders configured. Add folder mappings in Pricing Settings.",
      );
    }

    const configFolder = folders.find((f) => f.type === "config");
    if (!configFolder) {
      throw new ValidationException(
        "No config folder mapped. Add a folder with type 'config' in Pricing Settings to store generated master CSVs.",
      );
    }

    let gemsService: GemsService;
    try {
      gemsService = await this.createGemsService();
    } catch (err: unknown) {
      return {
        filesProcessed: 0,
        catalogRecords: 0,
        freightRecords: 0,
        suppliersFound: [],
        freightTypesFound: [],
        lastIndexedAt: new Date(),
        errors: [
          `AI settings not available — skipping file extraction: ${toErrorMessage(
            err,
          )}`,
        ],
      };
    }

    const driveConnector = new GoogleDriveConnectorService(
      driveSettings.serviceAccountKey,
    );
    const indexType: IndexType = type ?? "all";
    const now = new Date();
    const errors: string[] = [];
    let filesProcessed = 0;
    let catalogRecords: { supplier?: string }[] = [];
    let freightRecords: { rate_type?: string }[] = [];

    if (indexType === "pricing" || indexType === "all") {
      const pricingFolders = folders.filter((f) => f.type === "pricing");
      const currentCount = await this.catalogIndexer.getActiveRecordCount();
      const lastIndexed =
        force || currentCount === 0
          ? undefined
          : (pricingSettings?.catalogLastIndexed ?? undefined);

      const result = await this.catalogIndexer.index(
        gemsService,
        driveConnector,
        pricingFolders,
        configFolder.folderId,
        lastIndexed,
      );

      filesProcessed += result.filesProcessed;
      catalogRecords = result.records;
      errors.push(...result.errors);
      if (result.uploadWarning) errors.push(result.uploadWarning);

      if (result.errors.length === 0) {
        await this.pricingSettingsService.updateTimestamp(
          "catalogLastIndexed",
          now,
        );
      }
    }

    if (indexType === "freight" || indexType === "all") {
      const freightFolders = folders.filter((f) => f.type === "freight");
      const currentCount = await this.freightIndexer.getActiveRecordCount();
      const lastIndexed =
        force || currentCount === 0
          ? undefined
          : (pricingSettings?.freightLastIndexed ?? undefined);

      const result = await this.freightIndexer.index(
        gemsService,
        driveConnector,
        freightFolders,
        configFolder.folderId,
        lastIndexed,
      );

      filesProcessed += result.filesProcessed;
      freightRecords = result.records;
      errors.push(...result.errors);
      if (result.uploadWarning) errors.push(result.uploadWarning);

      if (result.errors.length === 0) {
        await this.pricingSettingsService.updateTimestamp(
          "freightLastIndexed",
          now,
        );
      }
    }

    const suppliersFound = [
      ...new Set(
        catalogRecords.map((r) => r.supplier).filter((s): s is string => !!s),
      ),
    ];
    const freightTypesFound = [
      ...new Set(
        freightRecords.map((r) => r.rate_type).filter((t): t is string => !!t),
      ),
    ];

    return {
      filesProcessed,
      catalogRecords: catalogRecords.length,
      freightRecords: freightRecords.length,
      suppliersFound,
      freightTypesFound,
      lastIndexedAt: now,
      errors,
    };
  }

  async getIndexingStatus(): Promise<{
    catalogRecords: number;
    freightRecords: number;
    catalogLastIndexed: Date | null;
    freightLastIndexed: Date | null;
    scheduledJobActive: boolean;
    isRunning: boolean;
    lastResult: IndexingSummary | null;
  }> {
    const [catalogRecords, freightRecords, pricingSettings] = await Promise.all(
      [
        this.catalogIndexer.getActiveRecordCount(),
        this.freightIndexer.getActiveRecordCount(),
        this.pricingSettingsService.getSettings().catch(() => null),
      ],
    );

    return {
      catalogRecords,
      freightRecords,
      catalogLastIndexed: pricingSettings?.catalogLastIndexed ?? null,
      freightLastIndexed: pricingSettings?.freightLastIndexed ?? null,
      scheduledJobActive: this.isScheduledIndexingActive(),
      isRunning: PricingIndexingService.isRunning,
      lastResult: PricingIndexingService.lastResult,
    };
  }

  startScheduledIndexing(intervalMs = 3600000): void {
    this.stopScheduledIndexing();
    PricingIndexingService.scheduledInterval = setInterval(() => {
      this.triggerIndexing("all").catch((err: unknown) => {
        console.error("Scheduled indexing failed:", toErrorMessage(err));
      });
    }, intervalMs);
  }

  stopScheduledIndexing(): void {
    if (PricingIndexingService.scheduledInterval) {
      clearInterval(PricingIndexingService.scheduledInterval);
      PricingIndexingService.scheduledInterval = null;
    }
  }

  isScheduledIndexingActive(): boolean {
    return PricingIndexingService.scheduledInterval !== null;
  }
}
