import {
  TaskDocument,
  ProjectDocument,
  TaskStageDocument,
  UserDocument,
  TicketDocument,
} from "@mongodb-types";
import {
  BaseService,
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
            this.connectionManager.getModel<TaskStageDocument>("TaskStage"),
          isArray: false,
        },
        {
          path: "projectId",
          getModel: () =>
            this.connectionManager.getModel<ProjectDocument>("TaskProject"),
          isArray: false,
        },
        {
          path: "ticketId",
          getModel: () =>
            this.connectionManager.getModel<TicketDocument>("Ticket"),
          isArray: false,
        },
        {
          path: "dependencyIds",
          getModel: () => this.connectionManager.getModel<TaskDocument>("Task"),
          isArray: true,
        },
        {
          path: "parentId",
          getModel: () => this.connectionManager.getModel<TaskDocument>("Task"),
          isArray: false,
        },
        {
          path: "createdBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "assigned",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Creates a new task document.
   * If isDefault is true, sets all other task stages to false.
   * @param data - The task data to create.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the created task document.
   */
  override async create(
    data: TaskDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<TaskDocument> {
    return await runTransaction<TaskDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();

      // HANDLE FILES IF PROVIDED
      if (
        isValidFileUpload(data.attachments) &&
        Array.isArray(data.attachments)
      ) {
        data.attachments = await Promise.all(
          data.attachments.map<Promise<InnerFile>>(async (file) => ({
            fileId: await bucket.uploadFile(file),
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

  /**
   * Updates an existing task.
   * Handles file uploads if provided and updates the updatedBy field.
   * @param data The task data to update.
   * @param session The optional client session to use for the transaction.
   * @returns A promise resolving to the updated task document.
   */
  override async update(
    data: UpdateTaskDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<TaskDocument> {
    return await runTransaction<TaskDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();

      // HANDLE FILES IF PROVIDED
      if (
        isValidFileUpload(data.attachments) &&
        Array.isArray(data.attachments)
      ) {
        data.attachments = await Promise.all(
          data.attachments.map<Promise<InnerFile>>(async (file) => ({
            fileId: await bucket.uploadFile(file),
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

  /**
   * Deletes an existing task.
   * When a task is deleted, all subtasks where parentId is the deleted task, should be removed from parentId.
   * @param _id - The ID of the task to delete.
   * @param session - The optional client session to use for the deletion.
   * @returns A promise resolving to a boolean indicating whether the deletion was successful.
   */
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
