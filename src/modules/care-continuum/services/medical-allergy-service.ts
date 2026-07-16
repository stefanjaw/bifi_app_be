import { BaseService } from "../../../system";
import { medicalAllergyModel } from "../models/medical-allergy.model";

/** Business logic service for medical allergy operations */
export class MedicalAllergyService extends BaseService<any> {
  constructor() {
    super({ model: medicalAllergyModel });
  }
}
