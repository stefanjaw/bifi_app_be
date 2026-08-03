import { AssetMaintenanceDocument } from "@mongodb-types";
import {
  authorizeMiddleware,
  BaseRoutes,
  validateBodyMiddleware,
  withAlsContext,
} from "../../../system";
import { AssetMaintenanceController } from "../controllers/asset-maintenance-controller";
import {
  AssetMaintenanceDTO,
  UpdateAssetMaintenanceDTO,
} from "../models/asset-maintenance.dto";

const assetMaintenanceController = new AssetMaintenanceController();

export class AssetMaintenanceRouter extends BaseRoutes<AssetMaintenanceDocument> {
  constructor() {
    super({
      controller: assetMaintenanceController,
      endpoint: "/asset-maintenances",
      dtoCreateClass: AssetMaintenanceDTO,
      dtoUpdateClass: UpdateAssetMaintenanceDTO,
    });
  }

  protected override initPostRoute(): void {
    this.router.post(
      this.endpoint,
      withAlsContext(this.upload.any()),
      validateBodyMiddleware(this.dtoCreateClass),
      authorizeMiddleware(this.resource, "create"),
      this.controller.create,
    );
  }

  protected override initPutRoute(): void {
    this.router.put(
      this.endpoint,
      withAlsContext(this.upload.any()),
      validateBodyMiddleware(this.dtoUpdateClass),
      authorizeMiddleware(this.resource, "update"),
      this.controller.update,
    );
  }
}
