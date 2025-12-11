import { BaseRoutes, validateBodyMiddleware } from "../../../system";
import { AssetCommissioningDocument } from "../../../types/mongoose.gen";
import { AssetCommissioningController } from "../controllers/asset-commissioning-controller";
import {
  AssetCommissioningDTO,
  UpdateAssetCommissioningDTO,
} from "../models/asset-commissioning.dto";

const assetCommissioningController = new AssetCommissioningController();

export class AssetCommissioningRouter extends BaseRoutes<AssetCommissioningDocument> {
  constructor() {
    super({
      controller: assetCommissioningController,
      endpoint: "/asset-commissioning",
      dtoCreateClass: AssetCommissioningDTO,
      dtoUpdateClass: UpdateAssetCommissioningDTO,
    });

    // custom routes
    this.initPutDecommissionRoute();
  }

  initPutDecommissionRoute() {
    // custom routes
    this.router.put(
      this.endpoint + "/decommission",
      this.upload.any(),
      validateBodyMiddleware(UpdateAssetCommissioningDTO),
      (this.controller as AssetCommissioningController).updateDecommission
    );
  }
}
