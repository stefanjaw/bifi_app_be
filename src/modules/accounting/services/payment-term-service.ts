import { BaseService } from "../../../system";
import { paymentTermModel, PaymentTermDocument } from "../models/payment-term.model";

export class PaymentTermService extends BaseService<PaymentTermDocument> {
  constructor() {
    super({ model: paymentTermModel });
  }
}
