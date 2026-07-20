import { BaseController } from "../../../../system";
import { OrderSetDocument } from "@mongodb-types";
import { OrderSetService } from "../services/order-set-service";

const orderSetService = new OrderSetService();

/** Express controller for clinical order set CRUD operations */
export class OrderSetController extends BaseController<OrderSetDocument> {
  constructor() {
    super({ service: orderSetService });
  }
}
