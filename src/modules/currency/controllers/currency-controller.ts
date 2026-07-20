import { BaseController } from "../../../system";
import { CurrencyDocument } from "../models/currency.model";
import { CurrencyService } from "../services/currency-service";

const currencyService = new CurrencyService();

import { Request, Response, NextFunction } from "express";

export class CurrencyController extends BaseController<CurrencyDocument> {
  constructor() {
    super({ service: currencyService });
  }

  async populateCurrencies(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await currencyService.populateCurrencies(undefined);
      res.status(200).json(records);
    } catch (error) {
      next(error);
    }
  }
}
