import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { DriveSettingsService } from "../services/drive-settings-service";
import { DriveSettingsDTO } from "../models/drive-settings.dto";
import { DriveSettingsDocument } from "../models/drive-settings.model";

export class DriveSettingsController extends BaseController<DriveSettingsDocument> {
  constructor() {
    super({ service: new DriveSettingsService() });
  }

  private maskServiceAccountKey(key?: string): string | undefined {
    if (!key) return undefined;
    if (key.length <= 12) return "••••••••";
    return key.substring(0, 6) + "••••" + key.substring(key.length - 6);
  }

  protected async getSettingsHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const settings = await (
        this.service as DriveSettingsService
      ).getSettings();
      if (settings) {
        const sanitized = settings.toObject();
        sanitized.serviceAccountKey = this.maskServiceAccountKey(
          sanitized.serviceAccountKey,
        );
        this.sendData(res, sanitized);
      } else {
        this.sendData(res, {});
      }
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
      const driveService = this.service as DriveSettingsService;

      const data = req.body as DriveSettingsDTO;
      if (data.serviceAccountKey && data.serviceAccountKey.includes("••••")) {
        delete data.serviceAccountKey;
      }

      const result = await driveService.upsertSettings(data);

      const sanitized = result.toObject();
      sanitized.serviceAccountKey = this.maskServiceAccountKey(
        sanitized.serviceAccountKey,
      );
      this.sendData(res, sanitized);
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
