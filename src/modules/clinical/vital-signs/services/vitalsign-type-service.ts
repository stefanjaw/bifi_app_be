import { VitalSignTypeDocument } from "@mongodb-types";
import { BaseService } from "../../../../system";
import { vitalSignTypeModel } from "../models/vitalsign-type.model";

/** Business logic service for vital-sign-type operations */
export class VitalSignTypeService extends BaseService<VitalSignTypeDocument> {
  constructor() {
    super({
      model: vitalSignTypeModel,
    });
  }
}
