import { BaseRoutes } from "../../../system";
import { OrderMaintenanceDocument } from "@mongodb-types";
import { OrderMaintenanceController } from "../controllers/order-maintenance-controller";
import {
  OrderMaintenanceDTO,
  UpdateOrderMaintenanceDTO,
} from "../models/order-maintenance.dto";

const orderMaintenanceController = new OrderMaintenanceController();

/** Route definitions for clinical order maintenance endpoints */
export class OrderMaintenanceRouter extends BaseRoutes<OrderMaintenanceDocument> {
  constructor() {
    super({
      controller: orderMaintenanceController,
      endpoint: "/order-maintenances",
      dtoCreateClass: OrderMaintenanceDTO,
      dtoUpdateClass: UpdateOrderMaintenanceDTO,
    });
  }
}
