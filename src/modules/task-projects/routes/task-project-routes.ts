import { TaskProjectDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { TaskProjectController } from "../controllers/task-project-controller";
import {
  TaskProjectDTO,
  UpdateTaskProjectDTO,
} from "../models/task-project.dto";

const taskProjectController = new TaskProjectController();

export class TaskProjectRouter extends BaseRoutes<TaskProjectDocument> {
  constructor() {
    super({
      controller: taskProjectController,
      endpoint: "/task-projects",
      dtoCreateClass: TaskProjectDTO,
      dtoUpdateClass: UpdateTaskProjectDTO,
    });
  }
}
