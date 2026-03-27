import { ProjectStageDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { ProjectStageService } from "../services/project-stage-service";

const projectStageService = new ProjectStageService();

export class ProjectStageController extends BaseController<ProjectStageDocument> {
  constructor() {
    super({
      service: projectStageService,
    });
  }
}
