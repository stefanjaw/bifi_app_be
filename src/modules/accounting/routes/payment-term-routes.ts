import { BaseRoutes } from "../../../system";
import { PaymentTermDocument } from "../models/payment-term.model";
import { PaymentTermController } from "../controllers/payment-term-controller";
import { PaymentTermDTO, UpdatePaymentTermDTO } from "../models/payment-term.dto";

const paymentTermController = new PaymentTermController();

export class PaymentTermRouter extends BaseRoutes<PaymentTermDocument> {
  constructor() {
    super({
      controller: paymentTermController,
      endpoint: "/accounting/payment-terms",
      dtoCreateClass: PaymentTermDTO,
      dtoUpdateClass: UpdatePaymentTermDTO,
    });
  }
}
