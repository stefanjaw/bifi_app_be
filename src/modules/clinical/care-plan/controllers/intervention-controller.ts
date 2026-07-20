import { BaseController } from "../../../../system";
import { InterventionDocument } from "@mongodb-types";
import { InterventionService } from "../services/intervention-service";
import { Request, Response, NextFunction } from "express";

const interventionService = new InterventionService();

/** Express controller for intervention CRUD operations */
export class InterventionController extends BaseController<InterventionDocument> {
  constructor() {
    super({ service: interventionService });
  }

  /** Adds an order set to an intervention */
  addOrderSet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (this.service as InterventionService).addOrderSet(
        req.params.id,
        req.body.orderSetId,
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  /** Removes an order set from an intervention */
  removeOrderSet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (this.service as InterventionService).removeOrderSet(
        req.params.id,
        req.body.orderSetId,
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  /** Adds multiple orders to an intervention */
  addMultipleOrders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await (
        this.service as InterventionService
      ).addMultipleOrders(req.params.id, req.body.orderIds);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  /** Removes multiple orders from an intervention */
  removeMultipleOrders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await (
        this.service as InterventionService
      ).removeMultipleOrders(req.params.id, req.body.orderIds);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
