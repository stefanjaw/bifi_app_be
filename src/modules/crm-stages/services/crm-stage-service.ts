import { BaseService } from "../../../system";
import { crmStageModel } from "../models/crm-stage.model";
import { CrmStageDocument } from "@mongodb-types";

export class CrmStageService extends BaseService<CrmStageDocument> {
  constructor() {
    super({
      model: crmStageModel,
    });
  }
}
