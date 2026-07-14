import { HelpdeskStageDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { HelpdeskStageController } from "../controllers/helpdesk-stage-controller";
import {
  HelpdeskStageDTO,
  UpdateHelpdeskStageDTO,
} from "../models/helpdesk-stage.dto";

const helpdeskStageController = new HelpdeskStageController();

export class HelpdeskStageRouter extends BaseRoutes<HelpdeskStageDocument> {
  constructor() {
    super({
      controller: helpdeskStageController,
      endpoint: "/helpdesk-stages",
      dtoCreateClass: HelpdeskStageDTO,
      dtoUpdateClass: UpdateHelpdeskStageDTO,
    });
  }
}
