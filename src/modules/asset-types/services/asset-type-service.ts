import { BaseService } from "../../../system";
import { AssetTypeDocument } from "../../../types/mongoose.gen";
import { assetTypeModel } from "../models/asset-type.model";

export class AssetTypeService extends BaseService<AssetTypeDocument> {
  constructor() {
    super({ model: assetTypeModel });
  }
}
