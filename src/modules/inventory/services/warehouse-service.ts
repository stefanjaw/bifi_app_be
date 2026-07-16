import { BaseService } from "../../../system";
import { warehouseModel, WarehouseDocument } from "../models/warehouse.model";

/** Business logic service for warehouse operations */
export class WarehouseService extends BaseService<WarehouseDocument> {
  constructor() {
    super({ model: warehouseModel });
  }
}
