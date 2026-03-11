import { BaseService } from "../../../system";
import { journalModel, JournalDocument } from "../models/journal.model";
import { AccountDocument, CurrencyDocument } from "@mongodb-types";

export class JournalService extends BaseService<JournalDocument> {
  constructor() {
    super({
      model: journalModel,
      refFields: [
        {
          path: "defaultDebitAccountId",
          getModel: () => this.connectionManager.getModel<AccountDocument>("Account"),
          isArray: false,
        },
        {
          path: "defaultCreditAccountId",
          getModel: () => this.connectionManager.getModel<AccountDocument>("Account"),
          isArray: false,
        },
        {
          path: "currencyId",
          getModel: () => this.connectionManager.getModel<CurrencyDocument>("Currency"),
          isArray: false,
        },
      ],
    });
  }
}
