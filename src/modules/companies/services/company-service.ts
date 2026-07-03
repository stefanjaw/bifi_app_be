import { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { companyModel } from "../models/company.model";
import {
  CompanyDocument,
  ContactDocument,
  CountryDocument,
} from "@mongodb-types";
import { CompanyDTO, UpdateCompanyDTO } from "../models/company.dto";

export class CompanyService extends BaseService<CompanyDocument> {
  constructor() {
    super({
      model: companyModel,
      refFields: [
        {
          path: "countryId",
          getModel: () =>
            this.connectionManager.getModel<CountryDocument>("Country"),
          isArray: false,
        },
        {
          path: "contactId",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: false,
        },
        {
          path: "parentCompany",
          getModel: () =>
            this.connectionManager.getModel<CompanyDocument>("Company"),
          isArray: false,
        },
      ],
    });
  }

  override async create(
    data: CompanyDTO,
    session: ClientSession | undefined = undefined,
  ): Promise<CompanyDocument> {
    return await runTransaction<CompanyDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        if (data.isDefault === true && data.parentCompany) {
          await model.updateMany(
            { parentCompany: data.parentCompany, isDefault: true },
            { $set: { isDefault: false } },
            { session: newSession },
          );
        }

        const record = (await model.create([data], { session: newSession }))[0];
        return record as CompanyDocument;
      },
    );
  }

  override async update(
    data: UpdateCompanyDTO,
    session: ClientSession | undefined = undefined,
  ): Promise<CompanyDocument> {
    return await runTransaction<CompanyDocument>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);
        const _id = data._id;
        delete (data as any)._id;

        if (data.isDefault === true) {
          const existing = await model.findById(_id).session(newSession);
          const alreadyDefault = existing?.isDefault === true;

          if (!alreadyDefault) {
            const parentCompany = data.parentCompany ?? existing?.parentCompany;
            if (parentCompany) {
              await model.updateMany(
                { parentCompany, isDefault: true },
                { $set: { isDefault: false } },
                { session: newSession },
              );
            }
          }
        }

        const record = await model.findByIdAndUpdate(_id, data, {
          session: newSession,
          new: true,
        });

        return record as CompanyDocument;
      },
    );
  }
}
