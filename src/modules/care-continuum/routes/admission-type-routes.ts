import { BaseRoutes } from "../../../system";
import { AdmissionTypeController } from "../controllers/admission-type-controller";
import {
  AdmissionTypeDTO,
  UpdateAdmissionTypeDTO,
} from "../models/admission-type.dto";

const admissionTypeController = new AdmissionTypeController();
/** Route definitions for admission type endpoints */
export class AdmissionTypeRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: admissionTypeController,
      endpoint: "/admission-types",
      dtoCreateClass: AdmissionTypeDTO,
      dtoUpdateClass: UpdateAdmissionTypeDTO,
    });
  }
}
