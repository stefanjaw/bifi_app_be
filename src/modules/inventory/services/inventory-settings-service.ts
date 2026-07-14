import { BaseService } from "../../../system";
import {
  inventorySettingsModel,
  InventorySettingsDocument,
} from "../models/inventory-settings.model";
import { InventorySettingsDTO } from "../models/inventory-settings.dto";

export class InventorySettingsService extends BaseService<InventorySettingsDocument> {
  constructor() {
    super({ model: inventorySettingsModel });
  }

  async getSettings(): Promise<InventorySettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(
    data: InventorySettingsDTO,
  ): Promise<InventorySettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }
}
