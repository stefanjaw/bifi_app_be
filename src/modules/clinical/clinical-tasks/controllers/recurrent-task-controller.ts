import { BaseController } from "../../../../system";
import { RecurrentTaskDocument } from "@mongodb-types";
import { RecurrentTaskService } from "../services/recurrent-task-service";

const recurrentTaskService = new RecurrentTaskService();

/** Controller for recurrent (scheduled) task operations */
export class RecurrentTaskController extends BaseController<RecurrentTaskDocument> {
  constructor() {
    super({ service: recurrentTaskService });
  }
}
