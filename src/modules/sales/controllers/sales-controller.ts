import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { SalesService } from "../services/sales-service";

const salesService = new SalesService();

export class SalesController extends BaseController<SalesOrderDocument> {
  constructor() {
    super({ service: salesService });
  }

  protected async getDashboardHandler(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const dashboard = await salesService.getDashboard();
      res.status(200).json(dashboard);
    } catch (error) {
      next(error);
    }
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    await this.getDashboardHandler(req, res, next);
  };
}
