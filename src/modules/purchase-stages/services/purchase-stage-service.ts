import { BaseService } from "../../../system";
import { purchaseStageModel, PurchaseStageDocument } from "../models/purchase-stage.model";

export class PurchaseStageService extends BaseService<PurchaseStageDocument> {
  constructor() {
    super({
      model: purchaseStageModel,
    });
  }
}
