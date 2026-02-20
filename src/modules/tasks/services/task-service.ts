import {
  TaskDocument,
  ProjectDocument,
  TaskStageDocument,
  UserDocument,
} from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  InnerFile,
  isValidFileUpload,
  runTransaction,
  userStorage,
  ValidationException,
} from "../../../system";
import { taskModel } from "../models/task.model";
import mongoose from "mongoose";
import { TaskDTO, UpdateTaskDTO } from "../models/task.dto";
import { TaskStageService } from "../../task-stages/services/task-stage-service";
import dayjs from "dayjs";

export class TaskService extends BaseService<TaskDocument> {
  private taskStageService = new TaskStageService();

  constructor() {
    super({
      model: taskModel,
      refFields: [
        {
          path: "stage",
          getModel: () =>
            this.connectionManager.getModelByDB<TaskStageDocument>("TaskStage"),
          isArray: false,
        },
        {
          path: "projectId",
          getModel: () =>
            this.connectionManager.getModelByDB<ProjectDocument>("TaskProject"),
          isArray: false,
        },
        {
          path: "dependencyIds",
          getModel: () =>
            this.connectionManager.getModelByDB<TaskDocument>("Task"),
          isArray: true,
        },
        {
          path: "parentId",
          getModel: () =>
            this.connectionManager.getModelByDB<TaskDocument>("Task"),
          isArray: false,
        },
        {
          path: "createdBy",
          getModel: () =>
            this.connectionManager.getModelByDB<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () =>
            this.connectionManager.getModelByDB<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "assigned",
          getModel: () =>
            this.connectionManager.getModelByDB<UserDocument>("User"),
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
    session?: mongoose.ClientSession | undefined,
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
          })),
        );
      }

      // HANDLE STAGE, IF NOT PROVIDED
      if (!data.stage) {
        const stages = await this.taskStageService.get(
          { isDefault: true },
          undefined,
          undefined,
          undefined,
          newSession,
        );

        if (!stages || stages.length === 0)
          throw new ValidationException(
            "No default stage found, please create one",
          );

        data.stage = stages[0]._id.toString();
      }

      if (!data.plannedStartDate) {
        data.plannedStartDate = data.plannedEndDate
          ? dayjs(data.plannedEndDate).subtract(1, "day").toDate()
          : dayjs().add(1, "day").toDate();
      }

      if (!data.plannedEndDate) {
        data.plannedEndDate = data.plannedStartDate
          ? dayjs(data.plannedStartDate).add(1, "day").toDate()
          : dayjs().add(1, "day").toDate();
      }

      return await super.create({
        ...data,
        createdBy: userStorage.getStore()?.user?._id,
      });
    });
  }

  override async update(
    data: UpdateTaskDTO,
    session?: mongoose.ClientSession | undefined,
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
          })),
        );
      }

      return await super.update({
        ...data,
        updatedBy: userStorage.getStore()?.user?._id,
      });
    });
  }

  override async delete(
    _id: string,
    session?: mongoose.ClientSession | undefined,
  ): Promise<boolean> {
    return await runTransaction<boolean>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);

      // when a task is deleted, all subtasks where parentId is the deleted task, should be removed from parentId
      await model.updateMany(
        { parentId: _id },
        { parentId: null },
        { session: newSession },
      );

      return await super.delete(_id, newSession);
    });
  }
}
