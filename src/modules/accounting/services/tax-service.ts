import mongoose from "mongoose";
import { BaseService } from "../../../system";
import { taxModel, TaxDocument } from "../models/tax.model";

export class TaxService extends BaseService<TaxDocument> {
  constructor() {
    super({
      model: taxModel,
      refFields: [
        {
          path: "accountId",
          getModel: () => mongoose.model("Account") as any,
          isArray: false,
        },
      ],
    });
  }
}
