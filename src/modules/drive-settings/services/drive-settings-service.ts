import { BaseService } from "../../../system";
import {
  driveSettingsModel,
  DriveSettingsDocument,
} from "../models/drive-settings.model";
import { DriveSettingsDTO } from "../models/drive-settings.dto";

export class DriveSettingsService extends BaseService<DriveSettingsDocument> {
  constructor() {
    super({
      model: driveSettingsModel,
    });
  }

  async getSettings(): Promise<DriveSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(data: DriveSettingsDTO): Promise<DriveSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    return (await model.create([data]))[0];
  }
}
