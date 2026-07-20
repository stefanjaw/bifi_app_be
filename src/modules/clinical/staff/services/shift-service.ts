import {
  GroupDocument,
  PatientDocument,
  ShiftDocument,
  StaffDocument,
} from "@mongodb-types";
import { BaseService } from "../../../../system";
import { shiftModel } from "../models/shift.model";

/** Business logic service for shift operations */
export class ShiftService extends BaseService<ShiftDocument> {
  constructor() {
    super({
      model: shiftModel,
      refFields: [
        {
          path: "manager",
          getModel: () =>
            this.connectionManager.getModel<StaffDocument>("Staff"),
          isArray: false,
        },
        {
          path: "weekdays.group_ids",
          getModel: () =>
            this.connectionManager.getModel<GroupDocument>("Group"),
          isArray: true,
        },
        {
          path: "staffId",
          getModel: () =>
            this.connectionManager.getModel<StaffDocument>("Staff"),
          isArray: false,
        },
        {
          path: "patientId",
          getModel: () =>
            this.connectionManager.getModel<PatientDocument>("Patient"),
          isArray: false,
        },
      ],
    });
  }
}
