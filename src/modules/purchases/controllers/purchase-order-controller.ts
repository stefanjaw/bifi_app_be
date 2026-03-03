import { BaseController } from "../../../system";
import { PurchaseOrderService } from "../services/purchase-order-service";
import { PurchaseOrderDocument } from "../models/purchase-order.model";
import { Request, Response, NextFunction } from "express";

const purchaseOrderService = new PurchaseOrderService();

export class PurchaseOrderController extends BaseController<PurchaseOrderDocument> {
  constructor() {
    super({ service: purchaseOrderService });
  }

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await purchaseOrderService.updateStatus(id, status);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };
}
