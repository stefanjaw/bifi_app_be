import { BaseRoutes } from "../../../../system";
import { MedicalAllergyController } from "../controllers/medical-allergy-controller";
import {
  MedicalAllergyDTO,
  UpdateMedicalAllergyDTO,
} from "../models/medical-allergy.dto";
import { MedicalAllergyDocument } from "../models/medical-allergy.model";

const medicalAllergyController = new MedicalAllergyController();
/** Route definitions for medical allergy endpoints */
export class MedicalAllergyRouter extends BaseRoutes<MedicalAllergyDocument> {
  constructor() {
    super({
      controller: medicalAllergyController,
      endpoint: "/medical-allergies",
      dtoCreateClass: MedicalAllergyDTO,
      dtoUpdateClass: UpdateMedicalAllergyDTO,
    });
  }
}
