import { BaseService } from "../../../system";
import {
  purchaseSettingsModel,
  PurchaseSettingsDocument,
} from "../models/purchase-settings.model";
import { PurchaseSettingsDTO } from "../models/purchase-settings.dto";

export class PurchaseSettingsService extends BaseService<PurchaseSettingsDocument> {
  constructor() {
    super({
      model: purchaseSettingsModel,
    });
  }

  async getSettings(): Promise<PurchaseSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(
    data: PurchaseSettingsDTO,
  ): Promise<PurchaseSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }
}
