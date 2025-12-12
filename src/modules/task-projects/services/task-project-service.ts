import { TaskProjectDocument, UserDocument } from "@mongodb-types";
import { BaseService, runTransaction, UserStore } from "../../../system";
import { taskProjectModel } from "../models/task-project.model";
import mongoose, { PaginateModel } from "mongoose";
import { TaskProjectDTO } from "../models/task-project.dto";

export class TaskProjectService extends BaseService<TaskProjectDocument> {
  constructor() {
    super({
      model: taskProjectModel,
      refFields: [
        {
          path: "createdBy",
          getModel: () => mongoose.model("User") as PaginateModel<UserDocument>,
          isArray: false,
        },
      ],
    });
  }

  override async create(
    data: TaskProjectDTO,
    session?: mongoose.ClientSession | undefined
  ): Promise<TaskProjectDocument> {
    return await runTransaction<TaskProjectDocument>(
      session,
      async (newSession) => {
        return await super.create(
          { ...data, createdBy: UserStore.getInstance().user?.id },
          newSession
        );
      }
    );
  }
}
