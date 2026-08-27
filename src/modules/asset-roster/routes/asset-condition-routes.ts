import { BaseRoutes } from "../../../system";
import { AssetConditionController } from "../controllers/asset-condition-controller";
import {
  AssetConditionDTO,
  UpdateAssetConditionDTO,
} from "../models/asset-condition.dto";

const assetConditionController = new AssetConditionController();

export class AssetConditionRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: assetConditionController,
      endpoint: "/asset-conditions",
      dtoCreateClass: AssetConditionDTO,
      dtoUpdateClass: UpdateAssetConditionDTO,
    });
  }
}
