import { OrderMaintenanceDocument, UserDocument } from "@mongodb-types";
import { BaseService } from "../../../../system";
import { orderMaintenanceModel } from "../models/order-maintenance.model";

/** Business logic service for clinical order maintenance operations */
export class OrderMaintenanceService extends BaseService<OrderMaintenanceDocument> {
  constructor() {
    super({
      model: orderMaintenanceModel,
      refFields: [
        {
          path: "createdBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
      ],
    });
  }
}
