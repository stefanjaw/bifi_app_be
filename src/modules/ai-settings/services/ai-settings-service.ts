import { BaseService } from "../../../system";
import {
  aiSettingsModel,
  AiSettingsDocument,
} from "../models/ai-settings.model";
import { AiSettingsDTO } from "../models/ai-settings.dto";

export class AiSettingsService extends BaseService<AiSettingsDocument> {
  constructor() {
    super({
      model: aiSettingsModel,
    });
  }

  async getSettings(): Promise<AiSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(data: AiSettingsDTO): Promise<AiSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }
}
