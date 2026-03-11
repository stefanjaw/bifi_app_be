import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { AccountingSettingsService } from "../services/accounting-settings-service";
import { AccountingSettingsDTO } from "../models/accounting-settings.dto";
import { AccountingSettingsDocument } from "../models/accounting-settings.model";

export class AccountingSettingsController extends BaseController<AccountingSettingsDocument> {
  constructor() {
    super({ service: new AccountingSettingsService() });
  }

  protected async getSettingsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await (this.service as AccountingSettingsService).getSettings();
      this.sendData(res, settings ?? {});
    } catch (error) {
      next(error);
    }
  }

  protected async upsertSettingsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as AccountingSettingsDTO;
      const result = await (this.service as AccountingSettingsService).upsertSettings(data);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    await this.getSettingsHandler(req, res, next);
  };

  upsertSettings = async (req: Request, res: Response, next: NextFunction) => {
    await this.upsertSettingsHandler(req, res, next);
  };
}
