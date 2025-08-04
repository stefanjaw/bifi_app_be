import { UserDocument } from "@mongodb-types";
import { BaseService, runTransaction } from "../../../system";
import { userModel } from "../models/user.model";
import { ClientSession } from "mongoose";

export class UserService extends BaseService<UserDocument> {
  constructor() {
    super({ model: userModel });
  }
}
