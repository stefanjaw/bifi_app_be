import { BaseService, runTransaction, ValidationException } from "../../../system";
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

  private validateMutualExclusivity(data: CrmStageDTO | UpdateCrmStageDTO): void {
    if (data.isWon && data.isLost) {
      throw new ValidationException("A stage cannot be both 'won' and 'lost'");
    }
  }

  override async create(
    data: CrmStageDTO,
    session?: ClientSession | undefined,
  ): Promise<CrmStageDocument> {
    this.validateMutualExclusivity(data);
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
    this.validateMutualExclusivity(data);
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
