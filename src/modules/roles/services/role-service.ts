import { PolicyDocument, RoleDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { roleModel } from "../models/role.model";
import mongoose from "mongoose";

export class RoleService extends BaseService<RoleDocument> {
  constructor() {
    super({
      model: roleModel,
      refFields: [
        {
          path: "policies",
          getModel: () =>
            mongoose.model("Policy") as mongoose.PaginateModel<PolicyDocument>,
          isArray: true,
        },
      ],
    });
  }
}
