import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { StockMovementDocument } from "../models/stock-movement.model";
import { InventoryValuationService } from "../services/inventory-valuation-service";
import { ValuationQuery } from "../services/inventory-valuation-service";

/** Express controller for the historical inventory valuation report */
export class InventoryValuationController extends BaseController<StockMovementDocument> {
  constructor() {
    super({ service: new InventoryValuationService() });
  }

  /**
   * Returns the inventory valuation report (AS_OF or DATE_RANGE) for the query parameters.
   * @param req - The request whose query carries mode, dates, and optional filters.
   * @param res - The express Response object.
   * @param next - The next middleware function for error handling.
   */
  getValuation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const report = await (
        this.service as InventoryValuationService
      ).getValuation(req.query as unknown as ValuationQuery);
      this.sendData(res, report);
    } catch (error) {
      next(error);
    }
  };
}
