import { BaseService } from "../../../../system";
import { medicalAllergyModel } from "../models/medical-allergy.model";
import { MedicalAllergyDocument } from "../models/medical-allergy.model";

/** Business logic service for medical allergy operations */
export class MedicalAllergyService extends BaseService<MedicalAllergyDocument> {
  constructor() {
    super({ model: medicalAllergyModel });
  }
}
