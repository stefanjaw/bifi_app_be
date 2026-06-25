import { BaseService } from "../../../system";
import { accountModel, AccountDocument } from "../models/account.model";
import { CompanyDocument, CurrencyDocument } from "@mongodb-types";

export class AccountService extends BaseService<AccountDocument> {
  constructor() {
    super({
      model: accountModel,
      refFields: [
        {
          path: "companyId",
          getModel: () =>
            this.connectionManager.getModel<CompanyDocument>("Company"),
          isArray: false,
        },
        {
          path: "parentAccountId",
          getModel: () =>
            this.connectionManager.getModel<AccountDocument>("Account"),
          isArray: false,
        },
        {
          path: "currencyId",
          getModel: () =>
            this.connectionManager.getModel<CurrencyDocument>("Currency"),
          isArray: false,
        },
      ],
    });
  }
}
