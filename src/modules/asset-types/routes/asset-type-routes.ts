import { BaseRoutes } from "../../../system";
import { AssetTypeDocument } from "../../../types/mongoose.gen";
import { AssetTypeController } from "../controllers/asset-type-controller";
import { AssetTypeDTO, UpdateAssetTypeDTO } from "../models/asset-type.dto";

const assetTypeController = new AssetTypeController();

export class AssetTypeRouter extends BaseRoutes<AssetTypeDocument> {
  constructor() {
    super({
      controller: assetTypeController,
      endpoint: "/asset-types",
      dtoCreateClass: AssetTypeDTO,
      dtoUpdateClass: UpdateAssetTypeDTO,
    });
  }
}
