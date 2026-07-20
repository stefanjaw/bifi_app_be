import { BaseRoutes } from "../../../../system";
import { RecurrentTaskController } from "../controllers/recurrent-task-controller";
import {
  RecurrentTaskDTO,
  UpdateRecurrentTaskDTO,
} from "../models/recurrent-task.dto";
import { RecurrentTaskDocument } from "../models/recurrent-task.model";

const recurrentTaskController = new RecurrentTaskController();
/** Route definitions for recurrent task endpoints */
export class RecurrentTaskRouter extends BaseRoutes<RecurrentTaskDocument> {
  constructor() {
    super({
      controller: recurrentTaskController,
      endpoint: "/recurrent-tasks",
      dtoCreateClass: RecurrentTaskDTO,
      dtoUpdateClass: UpdateRecurrentTaskDTO,
    });
  }
}
