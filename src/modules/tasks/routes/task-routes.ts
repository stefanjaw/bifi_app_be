import { TaskDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { TaskController } from "../controllers/task-controller";
import { TaskDTO, UpdateTaskDTO } from "../models/task.dto";

const taskController = new TaskController();

export class TaskRouter extends BaseRoutes<TaskDocument> {
  constructor() {
    super({
      controller: taskController,
      endpoint: "/tasks",
      dtoCreateClass: TaskDTO,
      dtoUpdateClass: UpdateTaskDTO,
    });
  }
}
