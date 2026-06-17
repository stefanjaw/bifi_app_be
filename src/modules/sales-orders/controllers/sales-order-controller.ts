import { Request, Response } from "express";
import { BaseController } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { SalesOrderService } from "../services/sales-order-service";
import { SalesOrderPdfService } from "../services/sales-order-pdf-service";

const salesOrderService = new SalesOrderService();
const salesOrderPdfService = new SalesOrderPdfService();

export class SalesOrderController extends BaseController<SalesOrderDocument> {
  constructor() {
    super({ service: salesOrderService });
  }

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await salesOrderService.updateStatus(id, status);
      if (!updated) {
        res.status(404).json({ message: "Sales order not found" });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ message: err.message });
    }
  };

  exportPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.service.getById(id, undefined);
      if (!record) {
        res.status(404).json({ message: "Sales order not found" });
        return;
      }
      const pdfBuffer = await salesOrderPdfService.generate(record);
      const status = (record as any).status ?? "draft";
      const prefix = ["draft", "quote"].includes(status) ? "quote" : "order";
      const docNumber = (record as any).number ?? id;
      const filename = `${prefix}-${docNumber}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ message: err.message });
    }
  };
}
