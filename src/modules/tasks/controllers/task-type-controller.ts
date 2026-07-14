import { TaskTypeDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { TaskTypeService } from "../services/task-type-service";

const taskTypeService = new TaskTypeService();

export class TaskTypeController extends BaseController<TaskTypeDocument> {
  constructor() {
    super({
      service: taskTypeService,
    });
  }
}
