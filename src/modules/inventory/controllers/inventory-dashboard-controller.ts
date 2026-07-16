import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { StockBalanceDocument } from "../models/stock-balance.model";
import { InventoryDashboardService } from "../services/inventory-dashboard-service";

/** Express controller for the inventory dashboard aggregated data */
export class InventoryDashboardController extends BaseController<StockBalanceDocument> {
  constructor() {
    super({ service: new InventoryDashboardService() });
  }

  getDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dashboard = await (
        this.service as InventoryDashboardService
      ).getDashboard();
      this.sendData(res, dashboard);
    } catch (error) {
      next(error);
    }
  };
}
