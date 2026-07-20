import { BaseService } from "../../../../system";
import { OutcomeDocument } from "@mongodb-types";
import { outcomeModel } from "../models/outcome.model";

/** Business logic service for outcome operations */
export class OutcomeService extends BaseService<OutcomeDocument> {
  constructor() {
    super({
      model: outcomeModel,
      refFields: [
        {
          path: "interventionId",
          getModel: () => this.connectionManager.getModel("Intervention"),
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
