import { BaseRoutes } from "../../../system";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { PurchaseOrderController } from "../controllers/purchase-order-controller";
import { PurchaseOrderDTO, UpdatePurchaseOrderDTO, UpdatePurchaseOrderStatusDTO } from "../models/purchase-order.dto";
import { PurchaseOrderDocument } from "../models/purchase-order.model";

const purchaseOrderController = new PurchaseOrderController();

export class PurchaseOrderRouter extends BaseRoutes<PurchaseOrderDocument> {
  constructor() {
    super({
      controller: purchaseOrderController,
      endpoint: "/purchases/orders",
      dtoCreateClass: PurchaseOrderDTO,
      dtoUpdateClass: UpdatePurchaseOrderDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();
    this.initExportPdfRoute();
    this.initUpdateStatusRoute();
  }

  private initExportPdfRoute() {
    this.router.get(
      `${this.endpoint}/:id/pdf`,
      authorizeMiddleware("purchases/orders", "read"),
      purchaseOrderController.exportPdf,
    );
  }

  private initUpdateStatusRoute() {
    this.router.patch(
      `${this.endpoint}/:id/status`,
      validateBodyMiddleware(UpdatePurchaseOrderStatusDTO),
      authorizeMiddleware("purchases/orders", "update"),
      purchaseOrderController.updateStatus
    );
  }
}
