import { ProjectDocument, UserDocument } from "@mongodb-types";
import { BaseService, runTransaction, UserStore } from "../../../system";
import { projectModel } from "../models/project.model";
import mongoose, { PaginateModel } from "mongoose";
import { ProjectDTO } from "../models/project.dto";

export class ProjectService extends BaseService<ProjectDocument> {
  constructor() {
    super({
      model: projectModel,
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
    data: ProjectDTO,
    session?: mongoose.ClientSession | undefined
  ): Promise<ProjectDocument> {
    return await runTransaction<ProjectDocument>(
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
