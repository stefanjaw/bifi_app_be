import {
  BaseService,
  NotFoundException,
} from "../../../../system";
import { InterventionDocument, OrderSetDocument, OrderDocument } from "@mongodb-types";
import { interventionModel } from "../models/intervention.model";
import { ClientSession } from "mongoose";

/** Business logic service for intervention operations */
export class InterventionService extends BaseService<InterventionDocument> {
  constructor() {
    super({
      model: interventionModel,
      refFields: [
        {
          path: "admissionGoalId",
          getModel: () => this.connectionManager.getModel("AdmissionGoal"),
          isArray: false,
        },
        {
          path: "patientId",
          getModel: () => this.connectionManager.getModel("Patient"),
          isArray: false,
        },
        {
          path: "outcomes",
          getModel: () => this.connectionManager.getModel("Outcome"),
          isArray: true,
        },
        {
          path: "orderSetIds",
          getModel: () => this.connectionManager.getModel("OrderSet"),
          isArray: true,
        },
        {
          path: "orderIds",
          getModel: () => this.connectionManager.getModel("Order"),
          isArray: true,
        },
        {
          path: "createdBy",
          getModel: () => this.connectionManager.getModel("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () => this.connectionManager.getModel("User"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Adds an order set to an intervention.
   * @param interventionId - The intervention ID
   * @param orderSetId - The order set ID to add
   * @param session - Optional Mongoose client session
   */
  async addOrderSet(
    interventionId: string,
    orderSetId: string,
    session?: ClientSession,
  ): Promise<InterventionDocument> {
    const intervention = await interventionModel
      .findById(interventionId)
      .session(session || null);
    if (!intervention) throw new NotFoundException("Intervention not found");

    const exists = intervention.orderSetIds?.some(
      (id: OrderSetDocument) => id.toString() === orderSetId,
    );
    if (!exists) {
      intervention.orderSetIds.push(orderSetId);
      await intervention.save({ session: session || undefined });
    }

    return intervention;
  }

  /**
   * Removes an order set from an intervention.
   * @param interventionId - The intervention ID
   * @param orderSetId - The order set ID to remove
   * @param session - Optional Mongoose client session
   */
  async removeOrderSet(
    interventionId: string,
    orderSetId: string,
    session?: ClientSession,
  ): Promise<InterventionDocument> {
    const intervention = await interventionModel
      .findById(interventionId)
      .session(session || null);
    if (!intervention) throw new NotFoundException("Intervention not found");

    await interventionModel.updateOne(
      { _id: interventionId },
      { $pull: { orderSetIds: orderSetId } },
      { session: session || undefined },
    );

    return intervention;
  }

  /**
   * Adds multiple orders to an intervention.
   * @param interventionId - The intervention ID
   * @param orderIds - The order IDs to add
   * @param session - Optional Mongoose client session
   */
  async addMultipleOrders(
    interventionId: string,
    orderIds: string[],
    session?: ClientSession,
  ): Promise<InterventionDocument> {
    const intervention = await interventionModel
      .findById(interventionId)
      .session(session || null);
    if (!intervention) throw new NotFoundException("Intervention not found");

    const existingIds = new Set(
      (intervention.orderIds || []).map((id: OrderDocument) => id.toString()),
    );
    const newIds = orderIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      await interventionModel.updateOne(
        { _id: interventionId },
        { $push: { orderIds: { $each: newIds } } },
        { session: session || undefined },
      );
    }

    return intervention;
  }

  /**
   * Removes multiple orders from an intervention.
   * @param interventionId - The intervention ID
   * @param orderIds - The order IDs to remove
   * @param session - Optional Mongoose client session
   */
  async removeMultipleOrders(
    interventionId: string,
    orderIds: string[],
    session?: ClientSession,
  ): Promise<InterventionDocument> {
    const intervention = await interventionModel
      .findById(interventionId)
      .session(session || null);
    if (!intervention) throw new NotFoundException("Intervention not found");

    await interventionModel.updateOne(
      { _id: interventionId },
      { $pullAll: { orderIds: orderIds } },
      { session: session || undefined },
    );

    return intervention;
  }
}
