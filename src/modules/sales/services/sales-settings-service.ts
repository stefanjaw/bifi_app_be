import { BaseService } from "../../../system";
import { salesSettingsModel, SalesSettingsDocument } from "../models/sales-settings.model";
import { SalesSettingsDTO } from "../models/sales-settings.dto";

export class SalesSettingsService extends BaseService<SalesSettingsDocument> {
  constructor() {
    super({
      model: salesSettingsModel,
    });
  }

  async getSettings(): Promise<SalesSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(data: SalesSettingsDTO): Promise<SalesSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }
}
