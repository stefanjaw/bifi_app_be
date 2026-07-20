import { BaseController } from "../../../../system";
import { VitalSignDocument } from "@mongodb-types";
import { VitalSignService } from "../services/vitalsign-service";
import { Request, Response, NextFunction } from "express";

const vitalSignService = new VitalSignService();

/** Express controller for vital sign CRUD operations */
export class VitalSignController extends BaseController<VitalSignDocument> {
  constructor() {
    super({ service: vitalSignService });
  }

  /** Creates multiple vital sign records in a single batch */
  createMany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await (this.service as VitalSignService).createMany(
        req.body,
      );
      this.sendData(res, records);
    } catch (error) {
      next(error);
    }
  };
}
