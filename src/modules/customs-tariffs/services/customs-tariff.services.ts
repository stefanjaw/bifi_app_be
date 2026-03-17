import { CustomsTariffDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { customsTariffModel } from "../models/customs-tariff.model";

export class CustomsTariffService extends BaseService<CustomsTariffDocument> {
  constructor() {
    super({
      model: customsTariffModel,
    });
  }

  async lookupByParts(
    chapter: string,
    heading: string,
    subheading: string,
  ): Promise<CustomsTariffDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const result = await model.findOne({ chapter, heading, subheading });
    return result as CustomsTariffDocument | null;
  }

  async lookupByCode(code: string): Promise<CustomsTariffDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const result = await model.findOne({ code });
    return result as CustomsTariffDocument | null;
  }
}
