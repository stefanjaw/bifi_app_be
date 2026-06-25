import { BaseRoutes } from "../../../system";
import { StockBalanceDocument } from "../models/stock-balance.model";
import { StockBalanceController } from "../controllers/stock-balance-controller";
import {
  StockBalanceDTO,
  UpdateStockBalanceDTO,
} from "../models/stock-balance.dto";

const stockBalanceController = new StockBalanceController();

export class StockBalanceRouter extends BaseRoutes<StockBalanceDocument> {
  constructor() {
    super({
      controller: stockBalanceController,
      endpoint: "/inventory/stock-balances",
      dtoCreateClass: StockBalanceDTO,
      dtoUpdateClass: UpdateStockBalanceDTO,
    });
  }
}
