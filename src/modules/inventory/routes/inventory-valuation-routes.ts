import { BaseRoutes, authorizeMiddleware } from "../../../system";
import { StockMovementDocument } from "../models/stock-movement.model";
import { InventoryValuationController } from "../controllers/inventory-valuation-controller";

const inventoryValuationController = new InventoryValuationController();

/** Route definitions for the inventory valuation report endpoint (read-only) */
export class InventoryValuationRouter extends BaseRoutes<StockMovementDocument> {
  constructor() {
    super({
      controller: inventoryValuationController,
      endpoint: "/inventory/valuation",
      dtoCreateClass: Object,
      dtoUpdateClass: Object,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/inventory/valuation",
      authorizeMiddleware("inventory/valuation", "read"),
      inventoryValuationController.getValuation,
    );
  }
}
