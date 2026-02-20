import { ProjectDocument, UserDocument } from "@mongodb-types";
import { BaseService, runTransaction, userStorage } from "../../../system";
import { projectModel } from "../models/project.model";
import mongoose from "mongoose";
import { ProjectDTO } from "../models/project.dto";

export class ProjectService extends BaseService<ProjectDocument> {
  constructor() {
    super({
      model: projectModel,
      refFields: [
        {
          path: "createdBy",
          getModel: () =>
            this.connectionManager.getModelByDB<UserDocument>("User"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Creates a new project document.
   * The document is created with the user who made the request as the createdBy user.
   * The function runs within a transaction and returns the created record.
   * @param data - The project data to create.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the created project document.
   */
  override async create(
    data: ProjectDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<ProjectDocument> {
    return await runTransaction<ProjectDocument>(
      session,
      async (newSession) => {
        return await super.create(
          { ...data, createdBy: userStorage.getStore()?.user?._id },
          newSession,
        );
      },
    );
  }
}
