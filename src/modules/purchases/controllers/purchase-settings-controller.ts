import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { PurchaseSettingsService } from "../services/purchase-settings-service";
import { PurchaseSettingsDTO } from "../models/purchase-settings.dto";
import { PurchaseSettingsDocument } from "../models/purchase-settings.model";

export class PurchaseSettingsController extends BaseController<PurchaseSettingsDocument> {
  constructor() {
    super({ service: new PurchaseSettingsService() });
  }

  protected async getSettingsHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const settings = await (
        this.service as PurchaseSettingsService
      ).getSettings();
      this.sendData(res, settings ?? {});
    } catch (error) {
      next(error);
    }
  }

  protected async upsertSettingsHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = req.body as PurchaseSettingsDTO;
      const result = await (
        this.service as PurchaseSettingsService
      ).upsertSettings(data);
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
