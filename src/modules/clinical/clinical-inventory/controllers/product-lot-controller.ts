import { BaseController } from "../../../../system";
import { ProductLotDocument } from "@mongodb-types";
import { ProductLotService } from "../services/product-lot-service";
import { Request, Response, NextFunction } from "express";

const productLotService = new ProductLotService();

/** Express controller for product lot CRUD operations */
export class ProductLotController extends BaseController<ProductLotDocument> {
  constructor() {
    super({ service: productLotService });
  }

  /** Adds a product to a lot */
  addProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (this.service as ProductLotService).addProduct(
        req.params.id,
        req.body.productId,
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  /** Removes a product from a lot */
  removeProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (this.service as ProductLotService).removeProduct(
        req.params.id,
        req.body.productId,
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
