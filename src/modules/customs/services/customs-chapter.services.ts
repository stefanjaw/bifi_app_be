import { CustomsChapterDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { customsChapterModel } from "../models/customs-chapter.model";

export class CustomsChapterService extends BaseService<CustomsChapterDocument> {
  constructor() {
    super({
      model: customsChapterModel,
    });
  }

  async lookupByNumber(number: string): Promise<CustomsChapterDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const result = await model.findOne({ number });
    return result as CustomsChapterDocument | null;
  }
}
