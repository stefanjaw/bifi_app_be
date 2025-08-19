import { RoleDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { RoleService } from "../services/role-service";

const roleService = new RoleService();

export class RoleController extends BaseController<RoleDocument> {
  constructor() {
    super({ service: roleService });
  }
}
