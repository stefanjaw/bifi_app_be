import { BaseController } from "../../../../system";
import { PatientDocument } from "@mongodb-types";
import { PatientService } from "../services/patient-service";
import { Request, Response, NextFunction } from "express";

const patientService = new PatientService();

/** Express controller for patient CRUD operations */
export class PatientController extends BaseController<PatientDocument> {
  constructor() {
    super({ service: patientService });
  }

  /** Gets patients available for admission */
  getAvailableToAdmit = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const results = await (
        this.service as PatientService
      ).getAvailableToAdmit();
      this.sendData(res, results);
    } catch (error) {
      next(error);
    }
  };

  /** Gets contacts available to create users */
  getAvailableToCreateUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const results = await (
        this.service as PatientService
      ).getAvailableToCreateUsers();
      this.sendData(res, results);
    } catch (error) {
      next(error);
    }
  };
}
