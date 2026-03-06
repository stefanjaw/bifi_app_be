import { BaseRoutes } from "../../../system";
import { PaymentDocument } from "../models/payment.model";
import { PaymentController } from "../controllers/payment-controller";
import { PaymentDTO, UpdatePaymentDTO } from "../models/payment.dto";

const paymentController = new PaymentController();

export class PaymentRouter extends BaseRoutes<PaymentDocument> {
  constructor() {
    super({
      controller: paymentController,
      endpoint: "/accounting/payments",
      dtoCreateClass: PaymentDTO,
      dtoUpdateClass: UpdatePaymentDTO,
    });
  }
}
