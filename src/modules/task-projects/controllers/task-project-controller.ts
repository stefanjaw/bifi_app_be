import { TaskProjectDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { TaskProjectService } from "../services/task-project-service";

const taskProjectService = new TaskProjectService();

export class TaskProjectController extends BaseController<TaskProjectDocument> {
  constructor() {
    super({
      service: taskProjectService,
    });
  }
}
