import { BaseService } from "../../../system";
import { salesOrderStageModel, SalesOrderStageDocument } from "../models/sales-order-stage.model";

export class SalesOrderStageService extends BaseService<SalesOrderStageDocument> {
  constructor() {
    super({
      model: salesOrderStageModel,
    });
  }
}
