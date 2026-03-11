import { Router } from "express";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { AccountingSettingsController } from "../controllers/accounting-settings-controller";
import { AccountingSettingsDTO } from "../models/accounting-settings.dto";

const accountingSettingsController = new AccountingSettingsController();

export class AccountingSettingsRouter {
  private router = Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/accounting/settings",
      authorizeMiddleware("accounting", "read"),
      accountingSettingsController.getSettings
    );

    this.router.put(
      "/accounting/settings",
      authorizeMiddleware("accounting", "update"),
      validateBodyMiddleware(AccountingSettingsDTO),
      accountingSettingsController.upsertSettings
    );
  }

  get getRouter() {
    return this.router;
  }
}
