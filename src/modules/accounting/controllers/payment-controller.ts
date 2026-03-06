import { BaseController } from "../../../system";
import { PaymentDocument } from "../models/payment.model";
import { PaymentService } from "../services/payment-service";

const paymentService = new PaymentService();

export class PaymentController extends BaseController<PaymentDocument> {
  constructor() {
    super({ service: paymentService });
  }
}
