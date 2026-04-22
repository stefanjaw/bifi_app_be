import { BaseRoutes } from "../../../system";
import { SalesOrderStageDocument } from "../models/sales-order-stage.model";
import { SalesOrderStageController } from "../controllers/sales-order-stage-controller";
import { SalesOrderStageDTO, UpdateSalesOrderStageDTO } from "../models/sales-order-stage.dto";

const salesOrderStageController = new SalesOrderStageController();

export class SalesOrderStageRouter extends BaseRoutes<SalesOrderStageDocument> {
  constructor() {
    super({
      controller: salesOrderStageController,
      endpoint: "/sales-order-stages",
      dtoCreateClass: SalesOrderStageDTO,
      dtoUpdateClass: UpdateSalesOrderStageDTO,
    });
  }
}
