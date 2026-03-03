import { BaseController } from "../../../system";
import { WarehouseDocument } from "../models/warehouse.model";
import { WarehouseService } from "../services/warehouse-service";

const warehouseService = new WarehouseService();

export class WarehouseController extends BaseController<WarehouseDocument> {
  constructor() {
    super({ service: warehouseService });
  }
}
