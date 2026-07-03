import { BaseService } from "../../../system";
import {
  accountingSettingsModel,
  AccountingSettingsDocument,
} from "../models/accounting-settings.model";
import { AccountingSettingsDTO } from "../models/accounting-settings.dto";

export class AccountingSettingsService extends BaseService<AccountingSettingsDocument> {
  constructor() {
    super({
      model: accountingSettingsModel,
    });
  }

  async getSettings(): Promise<AccountingSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(
    data: AccountingSettingsDTO,
  ): Promise<AccountingSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }
}
