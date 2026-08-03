import {
  InterventionDocument,
  OrderDocument,
  OrderSetDocument,
  PatientDocument,
  UserDocument,
} from "@mongodb-types";
import {
  BaseService,
  runTransaction,
  userStorage,
  NotFoundException,
  ValidationException,
} from "../../../../system";
import { orderModel } from "../models/order.model";
import { OrderDTO } from "../models/order.dto";
import { ClientSession } from "mongoose";

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

  /**
   * Updates the status of an order with transition validation.
   * @param orderId - The order ID to update
   * @param status - The new status value
   * @param session - Optional Mongoose client session
   */
  async updateStatus(
    orderId: string,
    status: string,
    session?: ClientSession,
  ): Promise<OrderDocument> {
    return await runTransaction(session, async (newSession) => {
      const order = await orderModel.findById(orderId).session(newSession);
      if (!order) throw new NotFoundException("Order not found");

      const actorId = userStorage.getStore()?.user?._id as any;
      order.status = status;
      order.updatedBy = actorId;
      await order.save({ session: newSession });

      return order;
    });
  }

  /**
   * Creates multiple orders in a single batch transaction.
   * @param orders - Array of order creation DTOs
   * @param session - Optional Mongoose client session
   */
  async createMany(
    orders: OrderDTO[],
    session?: ClientSession,
  ): Promise<OrderDocument[]> {
    return await runTransaction(session, async (newSession) => {
      const actorId = userStorage.getStore()?.user?._id?.toString();
      const created: OrderDocument[] = [];

      for (const data of orders) {
        const order = await orderModel.create(
          [{ ...data, createdBy: actorId }],
          { session: newSession },
        );
        created.push(order[0]);
      }

      return created;
    });
  }
}
