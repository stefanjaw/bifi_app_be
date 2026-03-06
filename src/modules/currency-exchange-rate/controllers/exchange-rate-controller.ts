import { BaseController } from "../../../system";
import { ExchangeRateDocument } from "../models/exchange-rate.model";
import { ExchangeRateService } from "../services/exchange-rate-service";

const exchangeRateService = new ExchangeRateService();

export class ExchangeRateController extends BaseController<ExchangeRateDocument> {
  constructor() {
    super({ service: exchangeRateService });
  }
}
