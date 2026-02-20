import { AssetRosterDocument } from "@mongodb-types";
import {
  authorizeMiddleware,
  BaseRoutes,
  validateBodyMiddleware,
} from "../../../system";
import { AssetRosterController } from "../controllers/asset-roster-controller";
import { AssetRosterCSVDTO } from "../models/asset-roster-csv.dto";
import {
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
    this.initSkipAssetPMRoute();
    this.initReadDocumentsRoute();
    super.initRoutes();
  }

  override initPutRoute() {
    this.router.put(
      this.endpoint,
      this.upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "attachments", maxCount: 10 },
      ]),
      validateBodyMiddleware(this.dtoUpdateClass),
      authorizeMiddleware(this.resource, "update"),
      this.controller.update,
    );
  }

  initSkipAssetPMRoute() {
    this.router.put(
      `${this.endpoint}/skip-pm`,
      this.upload.any(),
      validateBodyMiddleware(SkipAssetRosterPMDTO),
      authorizeMiddleware(`${this.resource}/skip-pm`, "update"),
      assetRosterController.updateSkipAssetPM,
    );
  }

  initReadDocumentsRoute() {
    this.router.post(
      `${this.endpoint}/read-documents`,
      this.upload.any(),
      assetRosterController.readDocuments,
    );
  }
}
