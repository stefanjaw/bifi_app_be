import { TaskStageDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { TaskStageService } from "../services/task-stage-service";

const taskStageService = new TaskStageService();

export class TaskStageController extends BaseController<TaskStageDocument> {
  constructor() {
    super({
      service: taskStageService,
    });
  }
}
