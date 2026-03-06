import { BaseRoutes } from "../../../system";
import { CurrencyDocument } from "../models/currency.model";
import { CurrencyController } from "../controllers/currency-controller";
import { CurrencyDTO, UpdateCurrencyDTO } from "../models/currency.dto";

const currencyController = new CurrencyController();

export class CurrencyRouter extends BaseRoutes<CurrencyDocument> {
  constructor() {
    super({
      controller: currencyController,
      endpoint: "/currencies",
      dtoCreateClass: CurrencyDTO,
      dtoUpdateClass: UpdateCurrencyDTO,
    });
  }
}
