import { BaseService } from "../../../system";
import {
  stockBalanceModel,
  StockBalanceDocument,
} from "../models/stock-balance.model";

/** Business logic service for stock balance operations */
export class StockBalanceService extends BaseService<StockBalanceDocument> {
  constructor() {
    super({ model: stockBalanceModel });
  }
}
