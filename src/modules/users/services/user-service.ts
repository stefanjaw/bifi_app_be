import { RoleDocument, UserDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { userModel } from "../models/user.model";
import mongoose from "mongoose";
import { PaginateModel } from "mongoose";

export class UserService extends BaseService<UserDocument> {
  constructor() {
    super({
      model: userModel,
      refFields: [
        {
          path: "roles",
          getModel: () => mongoose.model("Role") as PaginateModel<RoleDocument>,
          isArray: true,
        },
      ],
    });
  }
}
