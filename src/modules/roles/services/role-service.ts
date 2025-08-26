import { RoleDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { roleModel } from "../models/role.model";

export class RoleService extends BaseService<RoleDocument> {
  constructor() {
    super({ model: roleModel });
  }
}
