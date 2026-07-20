import { BaseRoutes } from "../../../../system";
import { PatientController } from "../controllers/patient-controller";
import { PatientDTO, UpdatePatientDTO } from "../models/patient.dto";
import { PatientDocument } from "../models/patient.model";

const patientController = new PatientController();

/** Route definitions for patient endpoints */
export class PatientRouter extends BaseRoutes<PatientDocument> {
  constructor() {
    super({
      controller: patientController,
      endpoint: "/patients",
      dtoCreateClass: PatientDTO,
      dtoUpdateClass: UpdatePatientDTO,
    });
  }
}
