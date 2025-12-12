import { TaskStageDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { taskStageModel } from "../models/task-stage.model";

export class TaskStageService extends BaseService<TaskStageDocument> {
  constructor() {
    super({
      model: taskStageModel,
    });
  }
}
