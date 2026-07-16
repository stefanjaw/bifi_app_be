import { BaseRoutes } from "../../../system";
import { RecurrentTaskController } from "../controllers/recurrent-task-controller";
import {
  RecurrentTaskDTO,
  UpdateRecurrentTaskDTO,
} from "../models/recurrent-task.dto";

const recurrentTaskController = new RecurrentTaskController();

export class RecurrentTaskRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: recurrentTaskController,
      endpoint: "/recurrent-tasks",
      dtoCreateClass: RecurrentTaskDTO,
      dtoUpdateClass: UpdateRecurrentTaskDTO,
    });
  }
}
