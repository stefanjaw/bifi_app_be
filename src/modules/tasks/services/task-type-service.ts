import { TaskTypeDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { taskTypeModel } from "../models/task-type.model";

export class TaskTypeService extends BaseService<TaskTypeDocument> {
  constructor() {
    super({
      model: taskTypeModel,
    });
  }
}
