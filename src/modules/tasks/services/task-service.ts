import {
  TaskDocument,
  TaskProjectDocument,
  TaskStageDocument,
  UserDocument,
} from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  InnerFile,
  isValidFileUpload,
  runTransaction,
  UserStore,
} from "../../../system";
import { taskModel } from "../models/task.model";
import mongoose, { PaginateModel } from "mongoose";
import { TaskDTO, UpdateTaskDTO } from "../models/task.dto";
import { TaskStageService } from "../../task-stages/services/task-stage-service";

export class TaskService extends BaseService<TaskDocument> {
  private taskStageService = new TaskStageService();

  constructor() {
    super({
      model: taskModel,
      refFields: [
        {
          path: "stage",
          getModel: () =>
            mongoose.model("TaskStage") as PaginateModel<TaskStageDocument>,
          isArray: false,
        },
        {
          path: "projectId",
          getModel: () =>
            mongoose.model("TaskProject") as PaginateModel<TaskProjectDocument>,
          isArray: false,
        },
        {
          path: "dependencyIds",
          getModel: () => taskModel,
          isArray: true,
        },
        {
          path: "parentId",
          getModel: () => taskModel,
          isArray: false,
        },
        {
          path: "createdBy",
          getModel: () => mongoose.model("User") as PaginateModel<UserDocument>,
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () => mongoose.model("User") as PaginateModel<UserDocument>,
          isArray: false,
        },
        {
          path: "assigned",
          getModel: () => mongoose.model("User") as PaginateModel<UserDocument>,
          isArray: false,
        },
      ],
    });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  override async create(
    data: TaskDTO,
    session?: mongoose.ClientSession | undefined
  ): Promise<TaskDocument> {
    return await runTransaction<TaskDocument>(session, async (newSession) => {
      // HANDLE FILES IF PROVIDED
      if (
        isValidFileUpload(data.attachments) &&
        Array.isArray(data.attachments)
      ) {
        data.attachments = await Promise.all(
          data.attachments.map<Promise<InnerFile>>(async (file) => ({
            fileId: await this.gridFSBucket.uploadFile(file),
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          }))
        );
      }

      // HANDLE STAGE, IF NOT PROVIDED
      if (!data.stage) {
        data.stage = (
          await this.taskStageService.get(
            { isDefault: true },
            undefined,
            undefined,
            undefined,
            newSession
          )
        )?.[0]?.id;
      }

      return await super.create({
        ...data,
        createdBy: UserStore.getInstance().user?.id,
      });
    });
  }

  override async update(
    data: UpdateTaskDTO,
    session?: mongoose.ClientSession | undefined
  ): Promise<TaskDocument> {
    return await runTransaction<TaskDocument>(session, async (newSession) => {
      // HANDLE FILES IF PROVIDED
      if (
        isValidFileUpload(data.attachments) &&
        Array.isArray(data.attachments)
      ) {
        data.attachments = await Promise.all(
          data.attachments.map<Promise<InnerFile>>(async (file) => ({
            fileId: await this.gridFSBucket.uploadFile(file),
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          }))
        );
      }

      return await super.update({
        ...data,
        updatedBy: UserStore.getInstance().user?.id,
      });
    });
  }
}
