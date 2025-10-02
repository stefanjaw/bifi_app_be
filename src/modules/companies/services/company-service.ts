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
            mongoose.model("Country") as PaginateModel<CountryDocument>,
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
