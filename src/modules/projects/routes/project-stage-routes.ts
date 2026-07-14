import { ProjectStageDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { ProjectStageController } from "../controllers/project-stage-controller";
import {
  ProjectStageDTO,
  UpdateProjectStageDTO,
} from "../models/project-stage.dto";

const projectStageController = new ProjectStageController();

export class ProjectStageRouter extends BaseRoutes<ProjectStageDocument> {
  constructor() {
    super({
      controller: projectStageController,
      endpoint: "/project-stages",
      dtoCreateClass: ProjectStageDTO,
      dtoUpdateClass: UpdateProjectStageDTO,
    });
  }
}
