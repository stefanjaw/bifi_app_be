import { BaseRoutes } from "../../../system";
import { authorizeMiddleware } from "../../../system";
import { InventoryDashboardController } from "../controllers/inventory-dashboard-controller";
import { StockBalanceDocument } from "../models/stock-balance.model";

const inventoryDashboardController = new InventoryDashboardController();

export class InventoryDashboardRouter extends BaseRoutes<StockBalanceDocument> {
  constructor() {
    super({
      controller: inventoryDashboardController,
      endpoint: "/inventory/dashboard",
      dtoCreateClass: Object,
      dtoUpdateClass: Object,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/inventory/dashboard",
      authorizeMiddleware("inventory", "read"),
      inventoryDashboardController.getDashboard,
    );
  }
}
