import { BaseService } from "../../../system";
import {
  exchangeRateModel,
  ExchangeRateDocument,
} from "../models/exchange-rate.model";
import { CurrencyDocument } from "@mongodb-types";

export class ExchangeRateService extends BaseService<ExchangeRateDocument> {
  constructor() {
    super({
      model: exchangeRateModel,
      refFields: [
        {
          path: "fromCurrencyId",
          getModel: () => this.connectionManager.getModel<CurrencyDocument>("Currency"),
          isArray: false,
        },
        {
          path: "toCurrencyId",
          getModel: () => this.connectionManager.getModel<CurrencyDocument>("Currency"),
          isArray: false,
        },
      ],
    });
  }
}
