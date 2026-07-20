import { BaseController } from "../../../../system";
import { OrderDocument } from "@mongodb-types";
import { OrderService } from "../services/order-service";
import { Request, Response, NextFunction } from "express";

const orderService = new OrderService();

/** Express controller for clinical order CRUD operations */
export class OrderController extends BaseController<OrderDocument> {
  constructor() {
    super({ service: orderService });
  }

  /** Updates the status of an order */
  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await (this.service as OrderService).updateStatus(
        req.params.id,
        req.body.status,
      );
      this.sendData(res, order);
    } catch (error) {
      next(error);
    }
  };

  /** Creates multiple orders in a single batch */
  createMany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await (this.service as OrderService).createMany(req.body);
      this.sendData(res, orders);
    } catch (error) {
      next(error);
    }
  };
}
