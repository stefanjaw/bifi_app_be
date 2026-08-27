import { AssetRosterDocument } from "@mongodb-types";
import {
  authorizeMiddleware,
  BaseRoutes,
  validateAndTransformCSVMiddleware,
  validateBodyMiddleware,
  withAlsContext,
} from "../../../system";
import { AssetRosterController } from "../controllers/asset-roster-controller";
import { AssetRosterCSVDTO } from "../models/asset-roster-csv.dto";
import {
  ArchiveAssetRostersDTO,
  AssetRosterDTO,
  SkipAssetRosterPMDTO,
  UpdateAssetRosterDTO,
} from "../models/asset-roster.dto";

const assetRosterController = new AssetRosterController();

export class AssetRosterRouter extends BaseRoutes<AssetRosterDocument> {
  constructor() {
    super({
      controller: assetRosterController,
      endpoint: "/asset-rosters",
      dtoCreateClass: AssetRosterDTO,
      dtoUpdateClass: UpdateAssetRosterDTO,
      csvDtoClass: AssetRosterCSVDTO,
    });
  }

  protected override initRoutes(): void {
    this.initValidateImportRoute();
    this.initArchiveSelectedRoute();
    this.initUnarchiveSelectedRoute();
    this.initSkipAssetPMRoute();
    this.initReadDocumentsRoute();
    super.initRoutes();
  }

  override initPutRoute() {
    this.router.put(
      this.endpoint,
      withAlsContext(
        this.upload.fields([
          { name: "photo", maxCount: 1 },
          { name: "attachments", maxCount: 10 },
        ]),
      ),
      validateBodyMiddleware(this.dtoUpdateClass),
      authorizeMiddleware(this.resource, "update"),
      this.controller.update,
    );
  }

  private initValidateImportRoute(): void {
    this.router.post(
      `${this.endpoint}/import/validate`,
      this.upload.single("csv"),
      validateAndTransformCSVMiddleware(AssetRosterCSVDTO),
      authorizeMiddleware(`${this.resource}/import`, "create"),
      assetRosterController.validateImport,
    );
  }

  private initArchiveSelectedRoute(): void {
    this.router.post(
      `${this.endpoint}/archive`,
      withAlsContext(this.upload.none()),
      validateBodyMiddleware(ArchiveAssetRostersDTO),
      authorizeMiddleware(this.resource, "update"),
      assetRosterController.archiveSelected,
    );
  }

  private initUnarchiveSelectedRoute(): void {
    this.router.post(
      `${this.endpoint}/unarchive`,
      withAlsContext(this.upload.none()),
      validateBodyMiddleware(ArchiveAssetRostersDTO),
      authorizeMiddleware(this.resource, "update"),
      assetRosterController.unarchiveSelected,
    );
  }

  initSkipAssetPMRoute() {
    this.router.put(
      `${this.endpoint}/skip-pm`,
      withAlsContext(this.upload.any()),
      validateBodyMiddleware(SkipAssetRosterPMDTO),
      authorizeMiddleware(`${this.resource}/skip-pm`, "update"),
      assetRosterController.updateSkipAssetPM,
    );
  }

  initReadDocumentsRoute() {
    this.router.post(
      `${this.endpoint}/read-documents`,
      withAlsContext(this.upload.any()),
      authorizeMiddleware(`${this.resource}/read-documents`, "create"),
      assetRosterController.readDocuments,
    );
  }
}
