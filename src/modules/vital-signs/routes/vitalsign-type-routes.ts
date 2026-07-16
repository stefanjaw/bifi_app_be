import { BaseRoutes } from "../../../system";
import { VitalSignTypeDocument } from "@mongodb-types";
import { VitalSignTypeController } from "../controllers/vitalsign-type-controller";
import {
  VitalSignTypeDTO,
  UpdateVitalSignTypeDTO,
} from "../models/vitalsign-type.dto";

const vitalSignTypeController = new VitalSignTypeController();

/** Route definitions for vital-sign-type endpoints */
export class VitalSignTypeRouter extends BaseRoutes<VitalSignTypeDocument> {
  constructor() {
    super({
      controller: vitalSignTypeController,
      endpoint: "/vital-sign-types",
      dtoCreateClass: VitalSignTypeDTO,
      dtoUpdateClass: UpdateVitalSignTypeDTO,
    });
  }
}
