import { BaseService } from "../../../system";
import { currencyModel, CurrencyDocument } from "../models/currency.model";

export class CurrencyService extends BaseService<CurrencyDocument> {
  constructor() {
    super({ model: currencyModel });
  }
}
