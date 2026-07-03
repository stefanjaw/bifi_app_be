import { BaseService } from "../../../system";
import {
  emailSettingsModel,
  EmailSettingsDocument,
} from "../models/email-settings.model";
import { EmailSettingsDTO } from "../models/email-settings.dto";
import { createSender } from "../senders/sender-factory";
import { VerifyResult } from "../senders/email-sender.interface";

export class EmailSettingsService extends BaseService<EmailSettingsDocument> {
  constructor() {
    super({
      model: emailSettingsModel,
    });
  }

  async getSettings(): Promise<EmailSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(
    data: Partial<EmailSettingsDTO>,
  ): Promise<EmailSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }

  async testConnection(): Promise<VerifyResult> {
    const settings = await this.getSettings();
    if (!settings) {
      return { ok: false, message: "Email settings are not configured yet." };
    }
    const sender = createSender(settings);
    return sender.verify();
  }
}
