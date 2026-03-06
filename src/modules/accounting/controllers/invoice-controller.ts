import { BaseController, BaseService } from "../../../system";
import { JournalEntryDocument } from "../models/journal-entry.model";
import { InvoiceService } from "../services/invoice-service";
import { NextFunction, Request, Response } from "express";

const invoiceService = new InvoiceService();

export class InvoiceController extends BaseController<JournalEntryDocument> {
  constructor() {
    super({ service: invoiceService as unknown as BaseService<JournalEntryDocument> });
  }

  getPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await invoiceService.getPayments(req.params.id);
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  registerPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await invoiceService.registerPayment(req.params.id, req.body);
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  postInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await invoiceService.post(req.params.id);
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  cancelInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await invoiceService.cancel(req.params.id);
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };
}
