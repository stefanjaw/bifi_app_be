import { BaseService } from "../../../../system";
import {
  crEinvoiceSettingsModel,
  CrEinvoiceSettingsDocument,
} from "../models/cr-einvoice-settings.model";
import { CrEinvoiceSettingsDTO } from "../models/cr-einvoice-settings.dto";
import { isValidFileUpload } from "../../../../system/libraries/file-storage/file-utils";

type UpsertData = CrEinvoiceSettingsDTO & {
  certificateFile?: Express.Multer.File;
};

export class CrEinvoiceSettingsService extends BaseService<CrEinvoiceSettingsDocument> {
  constructor() {
    super({ model: crEinvoiceSettingsModel });
  }

  async getSettings(): Promise<CrEinvoiceSettingsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne();
  }

  async upsertSettings(data: UpsertData): Promise<CrEinvoiceSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);

    const updateData: Record<string, any> = { ...data };

    if (isValidFileUpload(data.certificateFile)) {
      const bucket = this.connectionManager.bindBucketToDb();
      const file = data.certificateFile as Express.Multer.File;
      const fileId = await bucket.uploadFile(file);
      updateData.certificateFile = {
        fileId,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    } else {
      delete updateData.certificateFile;
    }

    const existing = await model.findOne();
    if (existing) {
      Object.assign(existing, updateData);
      return existing.save();
    }
    return (await model.create([updateData]))[0];
  }
}
