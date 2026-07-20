import { BaseController } from "../../../../system";
import { VitalSignDocument } from "@mongodb-types";
import { VitalSignService } from "../services/vitalsign-service";

const vitalSignService = new VitalSignService();

/** Express controller for vital sign CRUD operations */
export class VitalSignController extends BaseController<VitalSignDocument> {
  constructor() {
    super({ service: vitalSignService });
  }
}
