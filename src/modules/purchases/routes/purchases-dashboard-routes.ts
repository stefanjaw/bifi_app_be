import { BaseRoutes } from "../../../system";
import { authorizeMiddleware } from "../../../system";
import { PurchasesDashboardController } from "../controllers/purchases-dashboard-controller";
import { PurchaseOrderDocument } from "../models/purchase-order.model";

const purchasesDashboardController = new PurchasesDashboardController();

export class PurchasesDashboardRouter extends BaseRoutes<PurchaseOrderDocument> {
  constructor() {
    super({
      controller: purchasesDashboardController,
      endpoint: "/purchases/dashboard",
      dtoCreateClass: Object,
      dtoUpdateClass: Object,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/purchases/dashboard",
      authorizeMiddleware("purchases", "read"),
      purchasesDashboardController.getDashboard,
    );
  }
}
