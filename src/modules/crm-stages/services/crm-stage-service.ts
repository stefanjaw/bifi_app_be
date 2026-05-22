import { BaseService, runTransaction } from "../../../system";
import { crmStageModel } from "../models/crm-stage.model";
import { CrmStageDocument } from "@mongodb-types";
import { ClientSession } from "mongoose";
import { CrmStageDTO, UpdateCrmStageDTO } from "../models/crm-stage.dto";

export class CrmStageService extends BaseService<CrmStageDocument> {
  constructor() {
    super({
      model: crmStageModel,
    });
  }

  override async create(
    data: CrmStageDTO,
    session?: ClientSession | undefined,
  ): Promise<CrmStageDocument> {
    return await runTransaction<CrmStageDocument>(
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
    data: UpdateCrmStageDTO,
    session?: ClientSession | undefined,
  ): Promise<CrmStageDocument> {
    return await runTransaction<CrmStageDocument>(
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
