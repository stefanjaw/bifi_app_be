import { BaseRoutes } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { SalesOrderController } from "../controllers/sales-order-controller";
import { SalesOrderDTO, UpdateSalesOrderDTO } from "../models/sales-order.dto";

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
}
