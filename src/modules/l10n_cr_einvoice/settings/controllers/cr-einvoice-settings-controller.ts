import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../../system";
import { CrEinvoiceSettingsService } from "../services/cr-einvoice-settings-service";
import { CrEinvoiceSettingsDTO } from "../models/cr-einvoice-settings.dto";
import { CrEinvoiceSettingsDocument } from "../models/cr-einvoice-settings.model";

export class CrEinvoiceSettingsController extends BaseController<CrEinvoiceSettingsDocument> {
  constructor() {
    super({ service: new CrEinvoiceSettingsService() });
  }

  protected async getSettingsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await (this.service as CrEinvoiceSettingsService).getSettings();
      this.sendData(res, settings ?? {});
    } catch (error) {
      next(error);
    }
  }

  protected async upsertSettingsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as CrEinvoiceSettingsDTO;
      const result = await (this.service as CrEinvoiceSettingsService).upsertSettings(data);
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
