import { TaskTypeDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { TaskTypeController } from "../controllers/task-type-controller";
import { TaskTypeDTO, UpdateTaskTypeDTO } from "../models/task-type.dto";

const taskTypeController = new TaskTypeController();

export class TaskTypeRouter extends BaseRoutes<TaskTypeDocument> {
  constructor() {
    super({
      controller: taskTypeController,
      endpoint: "/task-types",
      dtoCreateClass: TaskTypeDTO,
      dtoUpdateClass: UpdateTaskTypeDTO,
    });
  }
}
