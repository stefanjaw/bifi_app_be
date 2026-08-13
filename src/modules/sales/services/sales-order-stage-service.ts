import {
  BaseService,
  runTransaction,
  ValidationException,
} from "../../../system";
import {
  salesOrderStageModel,
  SalesOrderStageDocument,
} from "../models/sales-order-stage.model";
import { ClientSession } from "mongoose";
import {
  SalesOrderStageDTO,
  UpdateSalesOrderStageDTO,
} from "../models/sales-order-stage.dto";

export class SalesOrderStageService extends BaseService<SalesOrderStageDocument> {
  constructor() {
    super({
      model: salesOrderStageModel,
    });
  }

  override async create(
    data: SalesOrderStageDTO,
    session?: ClientSession | undefined,
  ): Promise<SalesOrderStageDocument> {
    return await runTransaction<SalesOrderStageDocument>(
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
    data: UpdateSalesOrderStageDTO,
    session?: ClientSession | undefined,
  ): Promise<SalesOrderStageDocument> {
    return await runTransaction<SalesOrderStageDocument>(
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
