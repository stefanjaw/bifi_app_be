import { BaseController } from "../../../system";
import { PurchaseStageDocument } from "../models/purchase-stage.model";
import { PurchaseStageService } from "../services/purchase-stage-service";

const purchaseStageService = new PurchaseStageService();

export class PurchaseStageController extends BaseController<PurchaseStageDocument> {
  constructor() {
    super({ service: purchaseStageService });
  }
}
