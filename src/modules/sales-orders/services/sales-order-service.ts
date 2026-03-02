import { BaseService } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { salesOrderModel } from "../models/sales-order.model";

export class SalesOrderService extends BaseService<SalesOrderDocument> {
  constructor() {
    super({ model: salesOrderModel });
  }
}
