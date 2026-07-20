import { BaseService } from "../../../../system";
import { problemModel } from "../models/problem.model";
import { CareContinuumProblemDocument } from "../models/problem.model";

/** Business logic service for care continuum problem operations */
export class ProblemService extends BaseService<CareContinuumProblemDocument> {
  constructor() {
    super({
      model: problemModel,
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
