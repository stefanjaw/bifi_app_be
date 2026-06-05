import { BaseService } from "../../../../system";
import { crEinvoiceSettingsModel, CrEinvoiceSettingsDocument } from "../models/cr-einvoice-settings.model";
import { CrEinvoiceSettingsDTO } from "../models/cr-einvoice-settings.dto";

export class CrEinvoiceSettingsService extends BaseService<CrEinvoiceSettingsDocument> {
  constructor() {
    super({ model: crEinvoiceSettingsModel });
  }

  async getSettings(): Promise<CrEinvoiceSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(data: CrEinvoiceSettingsDTO): Promise<CrEinvoiceSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }
}
