import { TaskStageDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { TaskStageController } from "../controllers/task-stage-controller";
import { TaskStageDTO, UpdateTaskStageDTO } from "../models/task-stage.dto";

const taskStageController = new TaskStageController();

export class TaskStageRouter extends BaseRoutes<TaskStageDocument> {
  constructor() {
    super({
      controller: taskStageController,
      endpoint: "/task-stages",
      dtoCreateClass: TaskStageDTO,
      dtoUpdateClass: UpdateTaskStageDTO,
    });
  }
}
