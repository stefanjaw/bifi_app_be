import { BaseRoutes } from "../../../system";
import { PurchaseStageDocument } from "../models/purchase-stage.model";
import { PurchaseStageController } from "../controllers/purchase-stage-controller";
import { PurchaseStageDTO, UpdatePurchaseStageDTO } from "../models/purchase-stage.dto";

const purchaseStageController = new PurchaseStageController();

export class PurchaseStageRouter extends BaseRoutes<PurchaseStageDocument> {
  constructor() {
    super({
      controller: purchaseStageController,
      endpoint: "/purchase-stages",
      dtoCreateClass: PurchaseStageDTO,
      dtoUpdateClass: UpdatePurchaseStageDTO,
    });
  }
}
