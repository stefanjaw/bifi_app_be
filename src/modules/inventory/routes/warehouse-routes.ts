import { BaseRoutes } from "../../../system";
import { WarehouseDocument } from "../models/warehouse.model";
import { WarehouseController } from "../controllers/warehouse-controller";
import { WarehouseDTO, UpdateWarehouseDTO } from "../models/warehouse.dto";

const warehouseController = new WarehouseController();

export class WarehouseRouter extends BaseRoutes<WarehouseDocument> {
  constructor() {
    super({
      controller: warehouseController,
      endpoint: "/inventory/warehouses",
      dtoCreateClass: WarehouseDTO,
      dtoUpdateClass: UpdateWarehouseDTO,
    });
  }
}
