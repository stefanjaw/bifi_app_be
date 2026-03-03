import { BaseService } from "../../../system";
import { stockBalanceModel, StockBalanceDocument } from "../models/stock-balance.model";

export class StockBalanceService extends BaseService<StockBalanceDocument> {
  constructor() {
    super({ model: stockBalanceModel });
  }
}
