import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { InventorySettingsController } from "../controllers/inventory-settings-controller";
import { InventorySettingsDTO } from "../models/inventory-settings.dto";
import { InventorySettingsDocument } from "../models/inventory-settings.model";

const inventorySettingsController = new InventorySettingsController();

/** Route definitions for inventory settings endpoints */
export class InventorySettingsRouter extends BaseRoutes<InventorySettingsDocument> {
  constructor() {
    super({
      controller: inventorySettingsController,
      endpoint: "/inventory/settings",
      dtoCreateClass: InventorySettingsDTO,
      dtoUpdateClass: InventorySettingsDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/inventory/settings",
      authorizeMiddleware("inventory-settings", "read"),
      inventorySettingsController.getSettings,
    );

    this.router.put(
      "/inventory/settings",
      authorizeMiddleware("inventory-settings", "update"),
      validateBodyMiddleware(InventorySettingsDTO),
      inventorySettingsController.upsertSettings,
    );
  }
}
