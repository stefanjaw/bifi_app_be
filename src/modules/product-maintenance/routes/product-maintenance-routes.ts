import { ProductMaintenanceDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { ProductMaintenanceController } from "../controllers/product-maintenance-controller";
import {
  ProductMaintenanceDTO,
  UpdateProductMaintenanceDTO,
} from "../models/product-maintenance.dto";

const productMaintenanceController = new ProductMaintenanceController();

export class ProductMaintenanceRouter extends BaseRoutes<ProductMaintenanceDocument> {
  constructor() {
    super({
      controller: productMaintenanceController,
      endpoint: "/product-maintenances",
      dtoCreateClass: ProductMaintenanceDTO,
      dtoUpdateClass: UpdateProductMaintenanceDTO,
    });
  }
}
