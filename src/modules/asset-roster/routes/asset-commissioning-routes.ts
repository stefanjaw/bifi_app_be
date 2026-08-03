import {
  authorizeMiddleware,
  BaseRoutes,
  validateBodyMiddleware,
  withAlsContext,
} from "../../../system";
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

  initPutDecommissionRoute() {
    // custom routes
    this.router.put(
      this.endpoint + "/decommission",
      withAlsContext(this.upload.any()),
      validateBodyMiddleware(UpdateAssetCommissioningDTO),
      authorizeMiddleware(this.resource, "update"),
      (this.controller as AssetCommissioningController).updateDecommission,
    );
  }
}
