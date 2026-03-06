import mongoose from "mongoose";
import { BaseService } from "../../../system";
import {
  exchangeRateModel,
  ExchangeRateDocument,
} from "../models/exchange-rate.model";

export class ExchangeRateService extends BaseService<ExchangeRateDocument> {
  constructor() {
    super({
      model: exchangeRateModel,
      refFields: [
        {
          path: "fromCurrencyId",
          getModel: () => mongoose.model("Currency") as any,
          isArray: false,
        },
        {
          path: "toCurrencyId",
          getModel: () => mongoose.model("Currency") as any,
          isArray: false,
        },
      ],
    });
  }
}
