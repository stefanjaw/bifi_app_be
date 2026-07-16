import { BaseRoutes } from "../../../system";
import { MedicalPrecautionController } from "../controllers/medical-precaution-controller";
import {
  MedicalPrecautionDTO,
  UpdateMedicalPrecautionDTO,
} from "../models/medical-precaution.dto";

const medicalPrecautionController = new MedicalPrecautionController();
/** Route definitions for medical precaution endpoints */
export class MedicalPrecautionRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: medicalPrecautionController,
      endpoint: "/medical-precautions",
      dtoCreateClass: MedicalPrecautionDTO,
      dtoUpdateClass: UpdateMedicalPrecautionDTO,
    });
  }
}
