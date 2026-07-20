import { BaseController } from "../../../../system";
import { FluidTrackDocument } from "@mongodb-types";
import { FluidTrackService } from "../services/fluidtrack-service";
import { Request, Response, NextFunction } from "express";

const fluidTrackService = new FluidTrackService();

/** Express controller for fluid track CRUD operations */
export class FluidTrackController extends BaseController<FluidTrackDocument> {
  constructor() {
    super({ service: fluidTrackService });
  }

  /** Adds a fluid track item */
  addItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (this.service as FluidTrackService).addItem(
        req.params.id,
        req.body,
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  /** Gets fluid tracks within a date range */
  getFromDateDays = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await (this.service as FluidTrackService).getFromDateDays(
        req.query.patientId as string,
        Number(req.query.days) || 7,
      );
      this.sendData(res, results);
    } catch (error) {
      next(error);
    }
  };
}
