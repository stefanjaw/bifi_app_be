import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { SalesService } from "../services/sales-service";

export class SalesController extends BaseController<SalesOrderDocument> {
  constructor() {
    super({ service: new SalesService() });
  }

  protected async getDashboardHandler(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const dashboard = await (this.service as SalesService).getDashboard();
      this.sendData(res, dashboard);
    } catch (error) {
      next(error);
    }
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    await this.getDashboardHandler(req, res, next);
  };
}
