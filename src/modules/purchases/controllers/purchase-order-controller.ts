import { BaseController } from "../../../system";
import { PurchaseOrderService } from "../services/purchase-order-service";
import { PurchaseOrderPdfService } from "../services/purchase-order-pdf-service";
import { PurchaseOrderDocument } from "../models/purchase-order.model";
import { Request, Response, NextFunction } from "express";

const purchaseOrderPdfService = new PurchaseOrderPdfService();

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

  exportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.service.getById(id, undefined);
      if (!record) {
        res.status(404).json({ message: "Purchase order not found" });
        return;
      }
      const pdfBuffer = await purchaseOrderPdfService.generate(record);
      const filename = `purchase-order-${(record as any).poNumber ?? id}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
