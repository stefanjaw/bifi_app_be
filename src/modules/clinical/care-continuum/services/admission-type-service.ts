import { BaseService } from "../../../../system";
import { admissionTypeModel } from "../models/admission-type.model";
import { CareContinuumAdmissionTypeDocument } from "../models/admission-type.model";

/** Business logic service for admission type operations */
export class AdmissionTypeService extends BaseService<CareContinuumAdmissionTypeDocument> {
  constructor() {
    super({ model: admissionTypeModel });
  }
}
