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

  /**
   * Creates a new task stage.
   * If isDefault is true, sets all other task stages to false.
   * @param data The task stage data to create.
   * @param session The optional client session to use for the transaction.
   * @returns A promise resolving to the created task stage document.
   */
  override async create(
    data: TaskStageDTO,
    session?: ClientSession | undefined,
  ): Promise<TaskStageDocument> {
    return await runTransaction<TaskStageDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        // if isDefault is true, set all other stages to false
        if (data.isDefault) {
          await model.updateMany(
            { isDefault: true },
            { isDefault: false },
            { session: newSession },
          );
        }

        return await super.create(data, newSession);
      },
    );
  }

  /**
   * Updates a task stage with the given data.
   * If isDefault is true, sets all other task stages to false.
   * @param data The task stage data to update.
   * @param session The optional client session to use for the transaction.
   * @returns A promise resolving to the updated task stage document.
   */
  override async update(
    data: UpdateTaskStageDTO,
    session?: ClientSession | undefined,
  ): Promise<TaskStageDocument> {
    return await runTransaction<TaskStageDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        // if isDefault is true, set all other stages to false
        if (data.isDefault) {
          await model.updateMany(
            { isDefault: true },
            { isDefault: false },
            { session: newSession },
          );
        }

        return await super.update(data, newSession);
      },
    );
  }
}
