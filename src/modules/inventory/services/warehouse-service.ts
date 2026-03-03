import { BaseService } from "../../../system";
import { warehouseModel, WarehouseDocument } from "../models/warehouse.model";

export class WarehouseService extends BaseService<WarehouseDocument> {
  constructor() {
    super({ model: warehouseModel });
  }
}
