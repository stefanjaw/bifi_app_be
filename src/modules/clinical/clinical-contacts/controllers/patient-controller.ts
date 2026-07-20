import { BaseController } from "../../../../system";
import { PatientDocument } from "@mongodb-types";
import { PatientService } from "../services/patient-service";

const patientService = new PatientService();

/** Express controller for patient CRUD operations */
export class PatientController extends BaseController<PatientDocument> {
  constructor() {
    super({ service: patientService });
  }
}
