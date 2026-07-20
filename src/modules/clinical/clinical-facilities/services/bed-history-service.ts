import { BaseService } from "../../../../system";
import { bedHistoryModel } from "../models/bed-history.model";
import { BedHistoryDocument } from "../models/bed-history.model";

/** Service for bed history CRUD and audit logging */
export class BedHistoryService extends BaseService<BedHistoryDocument> {
  constructor() {
    super({
      model: bedHistoryModel,
      refFields: [
        {
          path: "bedId",
          getModel: () => this.connectionManager.getModel("Bed"),
          isArray: false,
        },
        {
          path: "createdBy",
          getModel: () => this.connectionManager.getModel("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () => this.connectionManager.getModel("User"),
          isArray: false,
        },
      ],
    });
  }
}
