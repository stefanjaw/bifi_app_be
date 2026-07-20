import { BaseRoutes, authorizeMiddleware } from "../../../../system";
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

  protected override initRoutes() {
    super.initRoutes();

    this.router.put(
      "/orders/:id/status",
      authorizeMiddleware("orders", "update"),
      orderController.updateStatus,
    );

    this.router.post(
      "/orders/many",
      authorizeMiddleware("orders", "create"),
      orderController.createMany,
    );
  }
}
