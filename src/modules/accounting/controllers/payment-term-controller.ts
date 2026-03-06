import { BaseController } from "../../../system";
import { PaymentTermDocument } from "../models/payment-term.model";
import { PaymentTermService } from "../services/payment-term-service";

const paymentTermService = new PaymentTermService();

export class PaymentTermController extends BaseController<PaymentTermDocument> {
  constructor() {
    super({ service: paymentTermService });
  }
}
