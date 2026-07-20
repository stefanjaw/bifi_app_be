import { BaseService } from "../../../../system";
import { AdmissionGoalDocument } from "@mongodb-types";
import { admissionGoalModel } from "../models/admission-goal.model";

/** Business logic service for admission goal operations */
export class AdmissionGoalService extends BaseService<AdmissionGoalDocument> {
  constructor() {
    super({
      model: admissionGoalModel,
      refFields: [
        {
          path: "careContinuumId",
          getModel: () => this.connectionManager.getModel("CareContinuum"),
          isArray: false,
        },
        {
          path: "patientId",
          getModel: () => this.connectionManager.getModel("Patient"),
          isArray: false,
        },
        {
          path: "interventions",
          getModel: () => this.connectionManager.getModel("Intervention"),
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
