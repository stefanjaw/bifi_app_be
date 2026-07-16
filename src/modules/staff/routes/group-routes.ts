import { BaseRoutes } from "../../../system";
import { GroupDocument } from "@mongodb-types";
import { GroupController } from "../controllers/group-controller";
import { GroupDTO, UpdateGroupDTO } from "../models/group.dto";

const groupController = new GroupController();

/** Route definitions for staff-group endpoints */
export class GroupRouter extends BaseRoutes<GroupDocument> {
  constructor() {
    super({
      controller: groupController,
      endpoint: "/staff-groups",
      dtoCreateClass: GroupDTO,
      dtoUpdateClass: UpdateGroupDTO,
    });
  }
}
