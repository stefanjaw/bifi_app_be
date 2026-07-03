import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { AiSettingsService } from "../services/ai-settings-service";
import { AiSettingsDTO } from "../models/ai-settings.dto";
import { AiSettingsDocument } from "../models/ai-settings.model";

export class AiSettingsController extends BaseController<AiSettingsDocument> {
  constructor() {
    super({ service: new AiSettingsService() });
  }

  private maskApiKey(key?: string): string | undefined {
    if (!key) return undefined;
    if (key.length <= 8) return "••••••••";
    return key.substring(0, 4) + "••••" + key.substring(key.length - 4);
  }

  protected async getSettingsHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const settings = await (this.service as AiSettingsService).getSettings();
      if (settings) {
        const sanitized = settings.toObject();
        sanitized.apiKey = this.maskApiKey(sanitized.apiKey);
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
      const data = req.body as AiSettingsDTO;
      if (data.apiKey && data.apiKey.includes("••••")) {
        delete data.apiKey;
      }
      const result = await (this.service as AiSettingsService).upsertSettings(
        data,
      );
      const sanitized = result.toObject();
      sanitized.apiKey = this.maskApiKey(sanitized.apiKey);
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
