import { BaseController } from "../../../system";
import { AssetTypeDocument } from "../../../types/mongoose.gen";
import { AssetTypeService } from "../services/asset-type-service";

const assetTypeService = new AssetTypeService();

export class AssetTypeController extends BaseController<AssetTypeDocument> {
  constructor() {
    super({ service: assetTypeService });
  }
}
