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
import { fireNotification } from "../../notifications/services/notification-service";
import { taskModel } from "../models/task.model";
import mongoose from "mongoose";
import { TaskDTO, UpdateTaskDTO } from "../models/task.dto";
import { TaskStageService } from "./task-stage-service";
import dayjs from "dayjs";

export class TaskService extends BaseService<TaskDocument> {
  private taskStageService = new TaskStageService();

  constructor() {
    super({
      model: taskModel,
      refFields: [
        {
          path: "assigned",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "contactId",
          getModel: () => this.connectionManager.getModel<any>("Contact"),
          isArray: false,
        },
        {
          path: "recurrentTaskId",
          getModel: () => this.connectionManager.getModel<any>("RecurrentTask"),
          isArray: false,
        },
        {
          path: "projectId",
          getModel: () =>
            this.connectionManager.getModel<ProjectDocument>("Project"),
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

      if ((data as any).projectId === "") {
        (data as any).projectId = null;
      }

      const actorId = userStorage.getStore()?.user?._id?.toString();
      const created = await super.create(
        {
          ...data,
          createdBy: actorId,
        },
        newSession,
      );

      // Alert 8: task assigned on creation
      if (data.assigned) {
        await fireNotification({
          type: "task_assigned",
          context: { assignee: data.assigned, creator: actorId },
          title: "Task assigned to you",
          body: `A new task has been assigned to you.`,
            link: `/tasks/view?id=${created._id}`,
          module: "tasks",
        });
      }

      return created;
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

      if ((data as any).projectId === "") {
        (data as any).projectId = null;
      }

      const actorId = userStorage.getStore()?.user?._id?.toString();
      const updated = await super.update(
        {
          ...data,
          updatedBy: actorId,
        },
        newSession,
      );

      // Alert 8: task assigned on update (fires whenever assigned is explicitly submitted)
      if (data.assigned !== undefined) {
        const newAssigned = data.assigned?.toString?.();
        if (newAssigned) {
          await fireNotification({
            type: "task_assigned",
            context: { assignee: data.assigned, creator: actorId },
            title: "Task assigned to you",
            body: `A task has been assigned to you.`,
            link: `/tasks/view?id=${(updated as any)._id}`,
            module: "tasks",
          });
        }
      }

      return updated;
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
