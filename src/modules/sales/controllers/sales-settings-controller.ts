import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { SalesSettingsService } from "../services/sales-settings-service";
import { SalesSettingsDTO } from "../models/sales-settings.dto";
import { SalesSettingsDocument } from "../models/sales-settings.model";

export class SalesSettingsController extends BaseController<SalesSettingsDocument> {
  constructor() {
    super({ service: new SalesSettingsService() });
  }

  protected async getSettingsHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const settings = await (
        this.service as SalesSettingsService
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
      const data = req.body as SalesSettingsDTO;
      const result = await (
        this.service as SalesSettingsService
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
