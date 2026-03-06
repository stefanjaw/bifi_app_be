import { BaseController } from "../../../system";
import { CurrencyDocument } from "../models/currency.model";
import { CurrencyService } from "../services/currency-service";

const currencyService = new CurrencyService();

export class CurrencyController extends BaseController<CurrencyDocument> {
  constructor() {
    super({ service: currencyService });
  }
}
