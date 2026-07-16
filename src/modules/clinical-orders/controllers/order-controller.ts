import { BaseController } from "../../../system";
import { OrderDocument } from "@mongodb-types";
import { OrderService } from "../services/order-service";

const orderService = new OrderService();

/** Express controller for clinical order CRUD operations */
export class OrderController extends BaseController<OrderDocument> {
  constructor() {
    super({ service: orderService });
  }
}
