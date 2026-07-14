import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { InventorySettingsService } from "../services/inventory-settings-service";
import { InventorySettingsDTO } from "../models/inventory-settings.dto";
import { InventorySettingsDocument } from "../models/inventory-settings.model";

export class InventorySettingsController extends BaseController<InventorySettingsDocument> {
  constructor() {
    super({ service: new InventorySettingsService() });
  }

  protected async getSettingsHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const settings = await (
        this.service as InventorySettingsService
      ).getSettings();
      this.sendData(res, settings ?? {});
    } catch (error) {
      next(error);
    }
  }

  protected async upsertSettingsHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = req.body as InventorySettingsDTO;
      const result = await (
        this.service as InventorySettingsService
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
