import { BaseController } from "../../../system";
import { AssetConditionService } from "../services/asset-condition-service";

const assetConditionService = new AssetConditionService();

export class AssetConditionController extends BaseController<any> {
  constructor() {
    super({ service: assetConditionService });
  }
}
