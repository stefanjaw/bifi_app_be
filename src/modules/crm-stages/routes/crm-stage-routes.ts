import { BaseRoutes } from "../../../system";
import { CrmStageDocument } from "@mongodb-types";
import { CrmStageController } from "../controllers/crm-stage-controller";
import { CrmStageDTO, UpdateCrmStageDTO } from "../models/crm-stage.dto";

const crmStageController = new CrmStageController();

export class CrmStageRouter extends BaseRoutes<CrmStageDocument> {
  constructor() {
    super({
      controller: crmStageController,
      endpoint: "/crm-stages",
      dtoCreateClass: CrmStageDTO,
      dtoUpdateClass: UpdateCrmStageDTO,
    });
  }
}
