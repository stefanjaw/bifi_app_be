import { AssetMaintenanceDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
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
}
