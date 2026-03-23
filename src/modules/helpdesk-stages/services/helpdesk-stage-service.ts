import { HelpdeskStageDocument } from "@mongodb-types";
import { BaseService, runTransaction } from "../../../system";
import { helpdeskStageModel } from "../models/helpdesk-stage.model";
import { ClientSession } from "mongoose";
import { HelpdeskStageDTO, UpdateHelpdeskStageDTO } from "../models/helpdesk-stage.dto";

export class HelpdeskStageService extends BaseService<HelpdeskStageDocument> {
  constructor() {
    super({
      model: helpdeskStageModel,
    });
  }

  override async create(
    data: HelpdeskStageDTO,
    session?: ClientSession | undefined,
  ): Promise<HelpdeskStageDocument> {
    return await runTransaction<HelpdeskStageDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

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

  override async update(
    data: UpdateHelpdeskStageDTO,
    session?: ClientSession | undefined,
  ): Promise<HelpdeskStageDocument> {
    return await runTransaction<HelpdeskStageDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

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
