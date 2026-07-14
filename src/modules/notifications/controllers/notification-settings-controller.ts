import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { NotificationEventSettingsService } from "../services/notification-settings-service";
import { NotificationEventSettingsDocument } from "../models/notification-settings.model";
import { EVENT_CATALOG } from "../constants/event-catalog";

export class NotificationEventSettingsController extends BaseController<NotificationEventSettingsDocument> {
  constructor() {
    super({ service: new NotificationEventSettingsService() });
  }

  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await (
        this.service as NotificationEventSettingsService
      ).getSettings();
      this.sendData(res, settings);
    } catch (error) {
      next(error);
    }
  };

  upsertSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (
        this.service as NotificationEventSettingsService
      ).upsertSettings(req.body);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  getCatalog = (req: Request, res: Response) => {
    this.sendData(res, EVENT_CATALOG);
  };
}
