import { BaseService } from "../../../system";
import {
  pricingSettingsModel,
  PricingSettingsDocument,
} from "../models/pricing-settings.model";
import { PricingSettingsDTO } from "../models/pricing-settings.dto";

export class PricingSettingsService extends BaseService<PricingSettingsDocument> {
  constructor() {
    super({
      model: pricingSettingsModel,
    });
  }

  async getSettings(): Promise<PricingSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(
    data: PricingSettingsDTO,
  ): Promise<PricingSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }

  async updateTimestamp(
    field: "catalogLastIndexed" | "freightLastIndexed",
    value: Date,
  ): Promise<void> {
    const model = this.connectionManager.bindModelToDb(this.model);
    await model.updateOne({}, { $set: { [field]: value } });
  }
}
