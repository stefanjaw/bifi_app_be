import { VitalSignDocument } from "@mongodb-types";
import { BaseService } from "../../../../system";
import { vitalSignModel } from "../models/vitalsign.model";
import { PatientDocument } from "@mongodb-types";
import { UserDocument } from "@mongodb-types";

/** Business logic service for vital sign operations */
export class VitalSignService extends BaseService<VitalSignDocument> {
  constructor() {
    super({
      model: vitalSignModel,
      refFields: [
        {
          path: "patientId",
          getModel: () =>
            this.connectionManager.getModel<PatientDocument>("Patient"),
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
