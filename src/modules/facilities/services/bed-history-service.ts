import { BaseService } from "../../../system";
import { bedHistoryModel } from "../models/bed-history.model";

export class BedHistoryService extends BaseService<any> {
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
