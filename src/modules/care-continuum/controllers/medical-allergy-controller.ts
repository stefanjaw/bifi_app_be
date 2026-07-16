import { BaseController } from "../../../system";
import { MedicalAllergyDocument } from "@mongodb-types";
import { MedicalAllergyService } from "../services/medical-allergy-service";

const medicalAllergyService = new MedicalAllergyService();
/** Express controller for medical allergy CRUD operations */
export class MedicalAllergyController extends BaseController<MedicalAllergyDocument> {
  constructor() {
    super({ service: medicalAllergyService });
  }
}
