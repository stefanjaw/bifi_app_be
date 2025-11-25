import { CRMDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { CRMService } from "../services/crm-service";

const crmService = new CRMService();

export class CRMController extends BaseController<CRMDocument> {
  constructor() {
    super({ service: crmService });
  }
}
