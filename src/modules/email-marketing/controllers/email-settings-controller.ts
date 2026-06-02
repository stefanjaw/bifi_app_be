import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { EmailSettingsService } from "../services/email-settings-service";
import { EmailSettingsDTO } from "../models/email-settings.dto";
import { EmailSettingsDocument } from "../models/email-settings.model";

const SECRET_FIELDS = [
  "resendApiKey",
  "mailgunApiKey",
  "sesAccessKeyId",
  "sesSecretAccessKey",
  "sendgridApiKey",
] as const;

export class EmailSettingsController extends BaseController<EmailSettingsDocument> {
  constructor() {
    super({ service: new EmailSettingsService() });
  }

  private mask(key?: string): string | undefined {
    if (!key) return key;
    if (key.length <= 8) return "••••••••";
    return key.substring(0, 4) + "••••" + key.substring(key.length - 4);
  }

  private sanitize(doc: any) {
    const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
    for (const field of SECRET_FIELDS) {
      if (obj[field]) obj[field] = this.mask(obj[field]);
    }
    return obj;
  }

  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await (
        this.service as EmailSettingsService
      ).getSettings();
      this.sendData(res, settings ? this.sanitize(settings) : {});
    } catch (error) {
      next(error);
    }
  };

  upsertSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = { ...req.body } as EmailSettingsDTO;
      for (const field of SECRET_FIELDS) {
        const value = (data as any)[field];
        if (typeof value === "string" && value.includes("••••")) {
          delete (data as any)[field];
        }
      }
      const result = await (
        this.service as EmailSettingsService
      ).upsertSettings(data);
      this.sendData(res, this.sanitize(result));
    } catch (error) {
      next(error);
    }
  };

  testConnection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (
        this.service as EmailSettingsService
      ).testConnection();
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
