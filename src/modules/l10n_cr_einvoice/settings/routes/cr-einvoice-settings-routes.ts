import { Router } from "express";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../../system";
import { CrEinvoiceSettingsController } from "../controllers/cr-einvoice-settings-controller";
import { CrEinvoiceSettingsDTO } from "../models/cr-einvoice-settings.dto";

const crEinvoiceSettingsController = new CrEinvoiceSettingsController();

export class CrEinvoiceSettingsRouter {
  private router = Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/cr-einvoice/settings",
      authorizeMiddleware("cr-einvoice/settings", "read"),
      crEinvoiceSettingsController.getSettings
    );

    this.router.put(
      "/cr-einvoice/settings",
      authorizeMiddleware("cr-einvoice/settings", "update"),
      validateBodyMiddleware(CrEinvoiceSettingsDTO),
      crEinvoiceSettingsController.upsertSettings
    );
  }

  get getRouter() {
    return this.router;
  }
}
