import { ProjectDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { ProjectController } from "../controllers/project-controller";
import { ProjectDTO, UpdateProjectDTO } from "../models/project.dto";

const projectController = new ProjectController();

export class ProjectRouter extends BaseRoutes<ProjectDocument> {
  constructor() {
    super({
      controller: projectController,
      endpoint: "/projects",
      dtoCreateClass: ProjectDTO,
      dtoUpdateClass: UpdateProjectDTO,
    });
  }
}
