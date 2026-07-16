import { BaseController } from "../../../system";
import { MaritalStatusDocument } from "@mongodb-types";
import { MaritalStatusService } from "../services/marital-status-service";

const maritalStatusService = new MaritalStatusService();

/** Express controller for marital status CRUD operations */
export class MaritalStatusController extends BaseController<MaritalStatusDocument> {
  constructor() {
    super({ service: maritalStatusService });
  }
}
