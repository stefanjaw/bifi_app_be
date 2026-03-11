import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { SalesController } from "../controllers/sales-controller";
import { SalesSettingsController } from "../controllers/sales-settings-controller";
import { SalesSettingsDTO } from "../models/sales-settings.dto";
import { SalesOrderDocument } from "@mongodb-types";

const salesController = new SalesController();
const salesSettingsController = new SalesSettingsController();

export class SalesRouter extends BaseRoutes<SalesOrderDocument> {
  constructor() {
    super({
      controller: salesController,
      endpoint: "/sales",
      dtoCreateClass: SalesSettingsDTO,
      dtoUpdateClass: SalesSettingsDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/sales/dashboard",
      authorizeMiddleware("sales", "read"),
      salesController.getDashboard
    );

    this.router.get(
      "/sales/settings",
      authorizeMiddleware("sales", "read"),
      salesSettingsController.getSettings
    );

    this.router.put(
      "/sales/settings",
      authorizeMiddleware("sales", "update"),
      validateBodyMiddleware(SalesSettingsDTO),
      salesSettingsController.upsertSettings
    );
  }
}
