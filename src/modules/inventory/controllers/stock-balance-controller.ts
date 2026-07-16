import { BaseController } from "../../../system";
import { StockBalanceDocument } from "../models/stock-balance.model";
import { StockBalanceService } from "../services/stock-balance-service";

const stockBalanceService = new StockBalanceService();

/** Express controller for stock balance CRUD operations */
export class StockBalanceController extends BaseController<StockBalanceDocument> {
  constructor() {
    super({ service: stockBalanceService });
  }
}
