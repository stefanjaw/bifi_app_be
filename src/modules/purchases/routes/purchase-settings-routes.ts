import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { PurchaseSettingsController } from "../controllers/purchase-settings-controller";
import { PurchaseSettingsDTO } from "../models/purchase-settings.dto";
import { PurchaseSettingsDocument } from "../models/purchase-settings.model";

const purchaseSettingsController = new PurchaseSettingsController();

export class PurchaseSettingsRouter extends BaseRoutes<PurchaseSettingsDocument> {
  constructor() {
    super({
      controller: purchaseSettingsController,
      endpoint: "/purchases/settings",
      dtoCreateClass: PurchaseSettingsDTO,
      dtoUpdateClass: PurchaseSettingsDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/purchases/settings",
      authorizeMiddleware("purchases", "read"),
      purchaseSettingsController.getSettings
    );

    this.router.put(
      "/purchases/settings",
      authorizeMiddleware("purchases", "update"),
      validateBodyMiddleware(PurchaseSettingsDTO),
      purchaseSettingsController.upsertSettings
    );
  }
}
