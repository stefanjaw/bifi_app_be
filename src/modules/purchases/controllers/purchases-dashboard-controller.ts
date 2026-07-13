import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { PurchaseOrderDocument } from "../models/purchase-order.model";
import { PurchasesDashboardService } from "../services/purchases-dashboard-service";

export class PurchasesDashboardController extends BaseController<PurchaseOrderDocument> {
  constructor() {
    super({ service: new PurchasesDashboardService() });
  }

  getDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dashboard = await (
        this.service as PurchasesDashboardService
      ).getDashboard();
      this.sendData(res, dashboard);
    } catch (error) {
      next(error);
    }
  };
}
