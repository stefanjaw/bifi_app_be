import { BaseService } from "../../../system";
import { taxModel, TaxDocument } from "../models/tax.model";
import { AccountDocument } from "@mongodb-types";

export class TaxService extends BaseService<TaxDocument> {
  constructor() {
    super({
      model: taxModel,
      refFields: [
        {
          path: "accountId",
          getModel: () => this.connectionManager.getModel<AccountDocument>("Account"),
          isArray: false,
        },
      ],
    });
  }
}
