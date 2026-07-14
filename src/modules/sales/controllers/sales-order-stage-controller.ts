import { BaseController } from "../../../system";
import { SalesOrderStageDocument } from "../models/sales-order-stage.model";
import { SalesOrderStageService } from "../services/sales-order-stage-service";

const salesOrderStageService = new SalesOrderStageService();

export class SalesOrderStageController extends BaseController<SalesOrderStageDocument> {
  constructor() {
    super({ service: salesOrderStageService });
  }
}
