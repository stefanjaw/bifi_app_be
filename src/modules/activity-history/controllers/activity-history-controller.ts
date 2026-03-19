import { ActivityHistoryService } from "../services/activity-history-service";
import { ActivityHistoryDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { Request, Response, NextFunction } from "express";

const activityHistoryService = new ActivityHistoryService();

export class ActivityHistoryController extends BaseController<ActivityHistoryDocument> {
  constructor() {
    super({ service: activityHistoryService });
  }

  protected override async exportCSVHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const assetRosterId = req.query.assetRosterId as string;
      const data = await (this.service as ActivityHistoryService).exportCSV({
        assetRosterId,
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "inline; filename=export.csv");

      res.write(data);
      res.end();
    } catch (error: any) {
      next(error);
    }
  }
}
