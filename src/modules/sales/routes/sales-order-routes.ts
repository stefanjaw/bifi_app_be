import {
  BaseRoutes,
  authorizeMiddleware,
  validateBodyMiddleware,
} from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { SalesOrderController } from "../controllers/sales-order-controller";
import {
  SalesOrderDTO,
  UpdateSalesOrderDTO,
  UpdateSalesOrderStatusDTO,
} from "../models/sales-order.dto";

const salesOrderController = new SalesOrderController();

export class SalesOrderRouter extends BaseRoutes<SalesOrderDocument> {
  constructor() {
    super({
      controller: salesOrderController,
      endpoint: "/sales-orders",
      dtoCreateClass: SalesOrderDTO,
      dtoUpdateClass: UpdateSalesOrderDTO,
    });
  }

  override initRoutes(): void {
    super.initRoutes();
    this.initExportPdfRoute();
    this.initUpdateStatusRoute();
  }

  private initExportPdfRoute(): void {
    this.router.get(
      `${this.endpoint}/:id/pdf`,
      authorizeMiddleware("sales-orders", "read"),
      salesOrderController.exportPdf,
    );
  }

  private initUpdateStatusRoute(): void {
    this.router.patch(
      `${this.endpoint}/:id/status`,
      authorizeMiddleware("sales-orders", "update"),
      validateBodyMiddleware(UpdateSalesOrderStatusDTO),
      salesOrderController.updateStatus,
    );
  }
}
