import { BaseController } from "../../../system";
import { CrmStageDocument } from "@mongodb-types";
import { CrmStageService } from "../services/crm-stage-service";

const crmStageService = new CrmStageService();

export class CrmStageController extends BaseController<CrmStageDocument> {
  constructor() {
    super({ service: crmStageService });
  }
}
