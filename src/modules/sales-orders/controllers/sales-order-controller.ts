import { BaseController } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { SalesOrderService } from "../services/sales-order-service";

const salesOrderService = new SalesOrderService();

export class SalesOrderController extends BaseController<SalesOrderDocument> {
  constructor() {
    super({ service: salesOrderService });
  }
}
