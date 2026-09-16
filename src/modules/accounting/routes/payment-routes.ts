import {
  BaseRoutes,
  authorizeMiddleware,
  validateBodyMiddleware,
} from "../../../system";
import { PaymentDocument } from "../models/payment.model";
import { PaymentController } from "../controllers/payment-controller";
import {
  ApplyPaymentDTO,
  PaymentDTO,
  UpdatePaymentDTO,
} from "../models/payment.dto";

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

  protected override initRoutes() {
    // The advances listing must be declared BEFORE the base `GET /:id` route
    // (registered by super.initRoutes) so it is not shadowed with id="advances".
    this.router.get(
      "/accounting/payments/advances",
      authorizeMiddleware("accounting/payments", "read"),
      paymentController.getPendingAdvances,
    );

    super.initRoutes();

    this.router.post(
      "/accounting/payments/:id/apply",
      authorizeMiddleware("accounting/payments", "update"),
      validateBodyMiddleware(ApplyPaymentDTO),
      paymentController.applyPayment,
    );
  }
}
