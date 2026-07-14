import { HelpdeskStageDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { HelpdeskStageService } from "../services/helpdesk-stage-service";

const helpdeskStageService = new HelpdeskStageService();

export class HelpdeskStageController extends BaseController<HelpdeskStageDocument> {
  constructor() {
    super({
      service: helpdeskStageService,
    });
  }
}
