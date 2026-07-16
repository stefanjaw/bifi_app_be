import { BaseRoutes } from "../../../system";
import { OrderSetDocument } from "@mongodb-types";
import { OrderSetController } from "../controllers/order-set-controller";
import { OrderSetDTO, UpdateOrderSetDTO } from "../models/order-set.dto";

const orderSetController = new OrderSetController();

/** Route definitions for clinical order set endpoints */
export class OrderSetRouter extends BaseRoutes<OrderSetDocument> {
  constructor() {
    super({
      controller: orderSetController,
      endpoint: "/order-sets",
      dtoCreateClass: OrderSetDTO,
      dtoUpdateClass: UpdateOrderSetDTO,
    });
  }
}
