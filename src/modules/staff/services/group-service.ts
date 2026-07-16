import { GroupDocument, StaffDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { groupModel } from "../models/group.model";

/** Business logic service for staff-group operations */
export class GroupService extends BaseService<GroupDocument> {
  constructor() {
    super({
      model: groupModel,
      refFields: [
        {
          path: "staff_ids.staff_id",
          getModel: () =>
            this.connectionManager.getModel<StaffDocument>("Staff"),
          isArray: true,
        },
      ],
    });
  }
}
