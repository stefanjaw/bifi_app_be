import {
  CareContinuumDocument,
  OrderDocument,
  OrderSetDocument,
  PatientDocument,
  UserDocument,
} from "@mongodb-types";
import { BaseService } from "../../../system";
import { orderSetModel } from "../models/order-set.model";

/** Business logic service for clinical order set operations */
export class OrderSetService extends BaseService<OrderSetDocument> {
  constructor() {
    super({
      model: orderSetModel,
      refFields: [
        {
          path: "careContinuumId",
          getModel: () =>
            this.connectionManager.getModel<CareContinuumDocument>(
              "CareContinuum",
            ),
          isArray: false,
        },
        {
          path: "patientId",
          getModel: () =>
            this.connectionManager.getModel<PatientDocument>("Patient"),
          isArray: false,
        },
        {
          path: "orders.orderId",
          getModel: () =>
            this.connectionManager.getModel<OrderDocument>("Order"),
          isArray: true,
        },
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
