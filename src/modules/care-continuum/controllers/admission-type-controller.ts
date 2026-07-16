import { BaseController } from "../../../system";
import { CareContinuumAdmissionTypeDocument } from "@mongodb-types";
import { AdmissionTypeService } from "../services/admission-type-service";

const admissionTypeService = new AdmissionTypeService();
/** Express controller for admission type CRUD operations */
export class AdmissionTypeController extends BaseController<CareContinuumAdmissionTypeDocument> {
  constructor() {
    super({ service: admissionTypeService });
  }
}
