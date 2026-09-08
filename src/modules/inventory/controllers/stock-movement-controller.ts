import { BaseController } from "../../../system";
import { StockMovementDocument } from "../models/stock-movement.model";
import { StockMovementService } from "../services/stock-movement-service";
import { Request, Response, NextFunction } from "express";

const stockMovementService = new StockMovementService();

/** Express controller for stock movement CRUD, transfer, and reversal operations */
export class StockMovementController extends BaseController<StockMovementDocument> {
  constructor() {
    super({ service: stockMovementService });
  }

  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await stockMovementService.transfer(req.body);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reverses a posted stock movement, creating an opposing movement linked via reversalOf.
   * @param req - The request containing the movement ID in params and optional notes in the body.
   * @param res - The express Response object.
   * @param next - The next middleware function for error handling.
   */
  reverse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await stockMovementService.reverse(
        req.params.id,
        req.body,
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
