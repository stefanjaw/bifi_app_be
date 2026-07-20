import { BaseController } from "../../../../system";
import { BedDocument } from "@mongodb-types";
import { BedService } from "../services/bed-service";
import { Request, Response, NextFunction } from "express";

const bedService = new BedService();

/** Controller for bed operations including reserve, assign, cancel, and availability queries */
export class BedController extends BaseController<BedDocument> {
  constructor() {
    super({ service: bedService });
  }

  /** Reserves a bed to a contact */
  reserve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bed = await (this.service as BedService).reserve(
        req.params.id,
        req.body.contactId,
      );
      this.sendData(res, bed);
    } catch (error) {
      next(error);
    }
  };

  /** Cancels a bed reservation */
  cancelReservation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const bed = await (this.service as BedService).cancelReservation(
        req.params.id,
      );
      this.sendData(res, bed);
    } catch (error) {
      next(error);
    }
  };

  /** Assigns a bed to a patient */
  assign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bed = await (this.service as BedService).assign(
        req.params.id,
        req.body.patientId,
      );
      this.sendData(res, bed);
    } catch (error) {
      next(error);
    }
  };

  /** Cancels a bed assignment */
  cancelAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const bed = await (this.service as BedService).cancelAssignment(
        req.params.id,
      );
      this.sendData(res, bed);
    } catch (error) {
      next(error);
    }
  };

  /** Gets facilities with available bed counts */
  getFacilitiesWithAvailableBeds = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const facilities = await (
        this.service as BedService
      ).getFacilitiesWithAvailableBeds();
      this.sendData(res, facilities);
    } catch (error) {
      next(error);
    }
  };
}
