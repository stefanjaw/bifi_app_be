import { BaseRoutes } from "../../../../system";
import { AdmissionTypeController } from "../controllers/admission-type-controller";
import {
  AdmissionTypeDTO,
  UpdateAdmissionTypeDTO,
} from "../models/admission-type.dto";
import { CareContinuumAdmissionTypeDocument } from "../models/admission-type.model";

const admissionTypeController = new AdmissionTypeController();
/** Route definitions for admission type endpoints */
export class AdmissionTypeRouter extends BaseRoutes<CareContinuumAdmissionTypeDocument> {
  constructor() {
    super({
      controller: admissionTypeController,
      endpoint: "/admission-types",
      dtoCreateClass: AdmissionTypeDTO,
      dtoUpdateClass: UpdateAdmissionTypeDTO,
    });
  }
}
