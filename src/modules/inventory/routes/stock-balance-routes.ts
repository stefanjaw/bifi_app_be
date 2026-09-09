import { BaseRoutes } from "../../../system";
import { StockBalanceDocument } from "../models/stock-balance.model";
import { StockBalanceController } from "../controllers/stock-balance-controller";
import {
  StockBalanceDTO,
  UpdateStockBalanceDTO,
} from "../models/stock-balance.dto";

const stockBalanceController = new StockBalanceController();

/**
 * Route definitions for stock balance endpoints.
 * Stock balances are derived from the movement ledger: direct creation/updating
 * via API would desynchronize balances from the movement-based inventory
 * valuation, so POST/PUT/DELETE are intentionally not registered (GET + export
 * remain available). Balance changes happen exclusively through stock movements
 * (StockMovementService).
 */
export class StockBalanceRouter extends BaseRoutes<StockBalanceDocument> {
  constructor() {
    super({
      controller: stockBalanceController,
      endpoint: "/inventory/stock-balances",
      dtoCreateClass: StockBalanceDTO,
      dtoUpdateClass: UpdateStockBalanceDTO,
    });
  }

  /** Balances are ledger-derived — direct creation via API is not allowed */
  protected override initPostRoute(): void {}

  /** Balances are ledger-derived — direct updates via API are not allowed */
  protected override initPutRoute(): void {}

  /** Balances are ledger-derived — direct deletions via API are not allowed */
  protected override initDeleteRoute(): void {}
}
