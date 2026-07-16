import { BaseService } from "../../../system";
import { medicalPrecautionModel } from "../models/medical-precaution.model";

/** Business logic service for medical precaution operations */
export class MedicalPrecautionService extends BaseService<any> {
  constructor() {
    super({ model: medicalPrecautionModel });
  }
}
