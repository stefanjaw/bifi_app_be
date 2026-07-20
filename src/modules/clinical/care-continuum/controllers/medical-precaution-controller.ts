import { BaseController } from "../../../../system";
import { MedicalPrecautionDocument } from "@mongodb-types";
import { MedicalPrecautionService } from "../services/medical-precaution-service";

const medicalPrecautionService = new MedicalPrecautionService();
/** Express controller for medical precaution CRUD operations */
export class MedicalPrecautionController extends BaseController<MedicalPrecautionDocument> {
  constructor() {
    super({ service: medicalPrecautionService });
  }
}
