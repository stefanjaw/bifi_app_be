import mongoose from "mongoose";
import { BaseService } from "../../../system";
import { journalModel, JournalDocument } from "../models/journal.model";

export class JournalService extends BaseService<JournalDocument> {
  constructor() {
    super({
      model: journalModel,
      refFields: [
        {
          path: "defaultDebitAccountId",
          getModel: () => mongoose.model("Account") as any,
          isArray: false,
        },
        {
          path: "defaultCreditAccountId",
          getModel: () => mongoose.model("Account") as any,
          isArray: false,
        },
        {
          path: "currencyId",
          getModel: () => mongoose.model("Currency") as any,
          isArray: false,
        },
      ],
    });
  }
}
