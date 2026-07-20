import {
  FluidTrackDocument,
  PatientDocument,
  UserDocument,
} from "@mongodb-types";
import { BaseService } from "../../../../system";
import { fluidTrackModel } from "../models/fluidtrack.model";

/** Business logic service for fluid track operations */
export class FluidTrackService extends BaseService<FluidTrackDocument> {
  constructor() {
    super({
      model: fluidTrackModel,
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
