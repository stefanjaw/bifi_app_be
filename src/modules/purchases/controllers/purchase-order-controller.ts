import { BaseController } from "../../../system";
import { PurchaseOrderService } from "../services/purchase-order-service";
import { PurchaseOrderDocument } from "../models/purchase-order.model";
import { Request, Response, NextFunction } from "express";

export class PurchaseOrderController extends BaseController<PurchaseOrderDocument> {
  constructor() {
    super({ service: new PurchaseOrderService() });
  }

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await (this.service as PurchaseOrderService).updateStatus(id, status);
      this.sendData(res, updated);
    } catch (error) {
      next(error);
    }
  };
}
