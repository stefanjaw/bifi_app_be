import { BaseController } from "../../../../system";
import { OrderMaintenanceDocument } from "@mongodb-types";
import { OrderMaintenanceService } from "../services/order-maintenance-service";

const orderMaintenanceService = new OrderMaintenanceService();

/** Express controller for clinical order maintenance CRUD operations */
export class OrderMaintenanceController extends BaseController<OrderMaintenanceDocument> {
  constructor() {
    super({ service: orderMaintenanceService });
  }
}
