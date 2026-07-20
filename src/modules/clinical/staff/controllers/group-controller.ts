import { BaseController } from "../../../../system";
import { GroupDocument } from "@mongodb-types";
import { GroupService } from "../services/group-service";

const groupService = new GroupService();

/** Express controller for staff-group CRUD operations */
export class GroupController extends BaseController<GroupDocument> {
  constructor() {
    super({ service: groupService });
  }
}
