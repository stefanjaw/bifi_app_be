import { BaseService } from "../../../../system";
import { recurrentTaskModel } from "../models/recurrent-task.model";
import { RecurrentTaskDocument } from "../models/recurrent-task.model";

export class RecurrentTaskService extends BaseService<RecurrentTaskDocument> {
  constructor() {
    super({
      model: recurrentTaskModel,
      refFields: [
        {
          path: "parentId",
          getModel: () => this.connectionManager.getModel("Task"),
          isArray: false,
        },
      ],
    });
  }
}
