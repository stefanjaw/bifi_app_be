import { BaseRoutes } from "../../../system";
import { ExchangeRateDocument } from "../models/exchange-rate.model";
import { ExchangeRateController } from "../controllers/exchange-rate-controller";
import {
  ExchangeRateDTO,
  UpdateExchangeRateDTO,
} from "../models/exchange-rate.dto";

const exchangeRateController = new ExchangeRateController();

export class ExchangeRateRouter extends BaseRoutes<ExchangeRateDocument> {
  constructor() {
    super({
      controller: exchangeRateController,
      endpoint: "/exchange-rates",
      dtoCreateClass: ExchangeRateDTO,
      dtoUpdateClass: UpdateExchangeRateDTO,
    });
  }
}
