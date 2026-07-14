import { CustomsHeadingDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { customsHeadingModel } from "../models/customs-heading.model";

export class CustomsHeadingService extends BaseService<CustomsHeadingDocument> {
  constructor() {
    super({
      model: customsHeadingModel,
    });
  }

  async lookupByChapterAndHeading(
    chapter: string,
    heading: string,
  ): Promise<CustomsHeadingDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const result = await model.findOne({ chapter, heading });
    return result as CustomsHeadingDocument | null;
  }
}
