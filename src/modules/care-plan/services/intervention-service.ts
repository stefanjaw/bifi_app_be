import { BaseService } from "../../../system";
import {
  interventionModel,
  InterventionDocument,
} from "../models/intervention.model";

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
}
