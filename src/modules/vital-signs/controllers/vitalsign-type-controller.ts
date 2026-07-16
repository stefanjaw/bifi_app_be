import { BaseController } from "../../../system";
import { VitalSignTypeDocument } from "@mongodb-types";
import { VitalSignTypeService } from "../services/vitalsign-type-service";

const vitalSignTypeService = new VitalSignTypeService();

/** Express controller for vital-sign-type CRUD operations */
export class VitalSignTypeController extends BaseController<VitalSignTypeDocument> {
  constructor() {
    super({ service: vitalSignTypeService });
  }
}
