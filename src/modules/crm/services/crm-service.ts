import mongoose from "mongoose";
import { CRMDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { crmModel } from "../models/crm.model";

export class CRMService extends BaseService<CRMDocument> {
  constructor() {
    super({
      model: crmModel,
      refFields: [
        {
          path: "stage",
          getModel: () => mongoose.model("CrmStage") as any,
          isArray: false,
        },
        {
          path: "contact",
          getModel: () => mongoose.model("Contact") as any,
          isArray: false,
        },
        {
          path: "company",
          getModel: () => mongoose.model("Company") as any,
          isArray: false,
        },
        {
          path: "owner",
          getModel: () => mongoose.model("User") as any,
          isArray: false,
        },
        {
          path: "salesperson",
          getModel: () => mongoose.model("User") as any,
          isArray: false,
        },
      ],
    });
  }
}
