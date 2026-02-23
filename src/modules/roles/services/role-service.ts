import { PolicyDocument, RoleDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { roleModel } from "../models/role.model";

export class RoleService extends BaseService<RoleDocument> {
  constructor() {
    super({
      model: roleModel,
      refFields: [
        {
          path: "policies",
          getModel: () =>
            this.connectionManager.getModel<PolicyDocument>("Policy"),
          isArray: true,
        },
      ],
    });
  }
}
