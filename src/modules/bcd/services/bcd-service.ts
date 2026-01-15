import { BCDDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdModel } from "../models/bcd.model";
import { ClientSession } from "mongoose";

export class BCDService extends BaseService<BCDDocument> {
  constructor() {
    super({
      model: bcdModel,
    });
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<BCDDocument> {
    const createdBCD = await super.create(data, session);

    const csvString = new (
      await import("./csv-builder")
    ).CsvBuilderService().create(createdBCD);
    console.log(csvString)

    return createdBCD;
  }
}
