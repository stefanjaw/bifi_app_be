import {
  InterventionDocument,
  OrderDocument,
  OrderSetDocument,
  PatientDocument,
  UserDocument,
} from "@mongodb-types";
import { BaseService } from "../../../system";
import { orderModel } from "../models/order.model";

/** Business logic service for clinical order operations */
export class OrderService extends BaseService<OrderDocument> {
  constructor() {
    super({
      model: orderModel,
      refFields: [
        {
          path: "orderSetId",
          getModel: () =>
            this.connectionManager.getModel<OrderSetDocument>("OrderSet"),
          isArray: false,
        },
        {
          path: "patientId",
          getModel: () =>
            this.connectionManager.getModel<PatientDocument>("Patient"),
          isArray: false,
        },
        {
          path: "interventionId",
          getModel: () =>
            this.connectionManager.getModel<InterventionDocument>(
              "Intervention",
            ),
          isArray: false,
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
