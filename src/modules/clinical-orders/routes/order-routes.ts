import { BaseRoutes } from "../../../system";
import { OrderDocument } from "@mongodb-types";
import { OrderController } from "../controllers/order-controller";
import { OrderDTO, UpdateOrderDTO } from "../models/order.dto";

const orderController = new OrderController();

/** Route definitions for clinical order endpoints */
export class OrderRouter extends BaseRoutes<OrderDocument> {
  constructor() {
    super({
      controller: orderController,
      endpoint: "/orders",
      dtoCreateClass: OrderDTO,
      dtoUpdateClass: UpdateOrderDTO,
    });
  }
}
