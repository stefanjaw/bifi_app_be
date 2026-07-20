import { ContactDocument, UserDocument, VendorDocument } from "@mongodb-types";
import { BaseService } from "../../../../system";
import { vendorModel } from "../models/vendor.model";

export class VendorService extends BaseService<VendorDocument> {
  constructor() {
    super({
      model: vendorModel,
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
