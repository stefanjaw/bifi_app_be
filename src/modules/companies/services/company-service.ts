import mongoose, { PaginateModel } from "mongoose";
import { BaseService } from "../../../system";
import { companyModel } from "../models/company.model";
import {
  CompanyDocument,
  ContactDocument,
  CountryDocument,
} from "@mongodb-types";

export class CompanyService extends BaseService<CompanyDocument> {
  constructor() {
    super({
      model: companyModel,
      refFields: [
        {
          path: "countryId",
          getModel: () =>
            this.connectionManager.getModelByDB<CountryDocument>("Country"),
          isArray: false,
        },
        {
          path: "contactId",
          getModel: () =>
            mongoose.model("Contact") as PaginateModel<ContactDocument>,
          isArray: false,
        },
      ],
    });
  }
}
