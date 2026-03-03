import { BaseController } from "../../../system";
import { StockMovementDocument } from "../models/stock-movement.model";
import { StockMovementService } from "../services/stock-movement-service";
import { Request, Response, NextFunction } from "express";

const stockMovementService = new StockMovementService();

export class StockMovementController extends BaseController<StockMovementDocument> {
  constructor() {
    super({ service: stockMovementService });
  }

  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await stockMovementService.transfer(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
