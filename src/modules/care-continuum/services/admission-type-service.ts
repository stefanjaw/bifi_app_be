import { BaseService } from "../../../system";
import { admissionTypeModel } from "../models/admission-type.model";

/** Business logic service for admission type operations */
export class AdmissionTypeService extends BaseService<any> {
  constructor() {
    super({ model: admissionTypeModel });
  }
}
