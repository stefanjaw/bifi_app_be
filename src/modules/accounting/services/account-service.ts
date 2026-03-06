import mongoose from "mongoose";
import { BaseService } from "../../../system";
import { accountModel, AccountDocument } from "../models/account.model";

export class AccountService extends BaseService<AccountDocument> {
  constructor() {
    super({
      model: accountModel,
      refFields: [
        {
          path: "companyId",
          getModel: () => mongoose.model("Company") as any,
          isArray: false,
        },
        {
          path: "parentAccountId",
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
