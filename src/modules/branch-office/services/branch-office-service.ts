import mongoose, { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import {
  branchOfficeModel,
  BranchOfficeDocument,
} from "../models/branch-office.model";

export class BranchOfficeService extends BaseService<BranchOfficeDocument> {
  constructor() {
    super({
      model: branchOfficeModel,
      refFields: [
        {
          path: "companyId",
          getModel: () => mongoose.model("Company") as any,
          isArray: false,
        },
        {
          path: "countryId",
          getModel: () => mongoose.model("Country") as any,
          isArray: false,
        },
      ],
    });
  }

  override async create(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<BranchOfficeDocument> {
    return await runTransaction<BranchOfficeDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        if (data.isDefault === true) {
          await model.updateMany(
            { companyId: data.companyId, isDefault: true },
            { $set: { isDefault: false } },
            { session: newSession },
          );
        }

        const record = (
          await model.create([data], { session: newSession })
        )[0];
        return record as BranchOfficeDocument;
      },
    );
  }

  override async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<BranchOfficeDocument> {
    return await runTransaction<BranchOfficeDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);
        const _id = data._id;
        delete data._id;

        if (data.isDefault === true) {
          const existing = await model.findById(_id).session(newSession);
          const alreadyDefault = existing?.isDefault === true;

          if (!alreadyDefault) {
            const companyId = data.companyId ?? existing?.companyId;
            await model.updateMany(
              { companyId, isDefault: true },
              { $set: { isDefault: false } },
              { session: newSession },
            );
          }
        }

        const record = await model.findByIdAndUpdate(_id, data, {
          session: newSession,
          new: true,
        });

        return record as BranchOfficeDocument;
      },
    );
  }
}
