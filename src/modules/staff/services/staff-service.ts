import { ContactDocument, StaffDocument, UserDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { staffModel } from "../models/staff.model";

/** Business logic service for staff operations */
export class StaffService extends BaseService<StaffDocument> {
  constructor() {
    super({
      model: staffModel,
      refFields: [
        {
          path: "contactId",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: false,
        },
        {
          path: "createdBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
      ],
    });
  }
}
