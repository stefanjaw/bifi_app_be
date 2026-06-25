import { ProjectStageDocument } from "@mongodb-types";
import { BaseService, runTransaction } from "../../../system";
import { projectStageModel } from "../models/project-stage.model";
import { ClientSession } from "mongoose";
import {
  ProjectStageDTO,
  UpdateProjectStageDTO,
} from "../models/project-stage.dto";

export class ProjectStageService extends BaseService<ProjectStageDocument> {
  constructor() {
    super({
      model: projectStageModel,
    });
  }

  override async create(
    data: ProjectStageDTO,
    session?: ClientSession | undefined
  ): Promise<ProjectStageDocument> {
    return await runTransaction<ProjectStageDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        if (data.isDefault) {
          await model.updateMany(
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
    data: UpdateProjectStageDTO,
    session?: ClientSession | undefined
  ): Promise<ProjectStageDocument> {
    return await runTransaction<ProjectStageDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        if (data.isDefault) {
          await model.updateMany(
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
