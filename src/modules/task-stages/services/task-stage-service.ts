import { TaskStageDocument } from "@mongodb-types";
import { BaseService, runTransaction } from "../../../system";
import { taskStageModel } from "../models/task-stage.model";
import { ClientSession } from "mongoose";
import { TaskStageDTO, UpdateTaskStageDTO } from "../models/task-stage.dto";

export class TaskStageService extends BaseService<TaskStageDocument> {
  constructor() {
    super({
      model: taskStageModel,
    });
  }

  override async create(
    data: TaskStageDTO,
    session?: ClientSession | undefined
  ): Promise<TaskStageDocument> {
    return await runTransaction<TaskStageDocument>(
      session,
      async (newSession) => {
        // if isDefault is true, set all other stages to false
        if (data.isDefault) {
          await this.model.updateMany(
            { isDefault: true },
            { isDefault: false },
            { session: newSession }
          );
        }

        return await super.create(data, newSession);
      }
    );
  }

  override async update(
    data: UpdateTaskStageDTO,
    session?: ClientSession | undefined
  ): Promise<TaskStageDocument> {
    return await runTransaction<TaskStageDocument>(
      session,
      async (newSession) => {
        // if isDefault is true, set all other stages to false
        if (data.isDefault) {
          await this.model.updateMany(
            { isDefault: true },
            { isDefault: false },
            { session: newSession }
          );
        }

        return await super.update(data, newSession);
      }
    );
  }
}
