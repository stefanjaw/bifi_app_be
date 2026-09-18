import { BaseController } from "../../../system";
import { NextFunction, Request, Response } from "express";
import { PaymentDocument } from "../models/payment.model";
import { PaymentService } from "../services/payment-service";

const paymentService = new PaymentService();

export class PaymentController extends BaseController<PaymentDocument> {
  constructor() {
    super({ service: paymentService });
  }

  /** Confirms a draft payment (flips payment + settlement JE to CONFIRMED/POSTED) */
  confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await paymentService.confirm(req.params.id);
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  /** Applies a customer advance payment to a posted invoice */
  applyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await paymentService.apply(
        req.params.id,
        req.body.invoiceId,
      );
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };

  /** Lists advance payments available for application (optional partner filter) */
  getPendingAdvances = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await paymentService.getPendingAdvances(
        (req.query.partnerId as string) || undefined,
      );
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };
}
