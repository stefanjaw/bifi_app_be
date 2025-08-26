import { RoleDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { RoleController } from "../controllers/role-controller";
import { RoleDTO, UpdateRoleDTO } from "../models/role.dto";

const roleController = new RoleController();

export class RoleRouter extends BaseRoutes<RoleDocument> {
  constructor() {
    super({
      controller: roleController,
      endpoint: "/roles",
      dtoCreateClass: RoleDTO,
      dtoUpdateClass: UpdateRoleDTO,
    });
  }
}
