import { ProjectDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { ProjectService } from "../services/project-service";

const projectService = new ProjectService();

export class ProjectController extends BaseController<ProjectDocument> {
  constructor() {
    super({
      service: projectService,
    });
  }
}
