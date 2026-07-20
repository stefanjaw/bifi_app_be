import { BaseRoutes, authorizeMiddleware } from "../../../../system";
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

  protected override initRoutes() {
    super.initRoutes();

    this.router.get(
      "/patients/available-to-admit",
      authorizeMiddleware("patients", "read"),
      patientController.getAvailableToAdmit,
    );

    this.router.get(
      "/patients/available-to-create-users",
      authorizeMiddleware("patients", "read"),
      patientController.getAvailableToCreateUsers,
    );
  }
}
