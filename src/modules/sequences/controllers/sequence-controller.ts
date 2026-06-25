import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { ValidationException } from "../../../system/libraries/exceptions/service-exception";
import { SequenceDocument } from "../models/sequence.model";
import { SequenceService } from "../services/sequence-service";

const sequenceService = new SequenceService();

export class SequenceController extends BaseController<SequenceDocument> {
  constructor() {
    super({ service: sequenceService });
  }

  getNextNumber = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prefix } = req.body;

      if (!prefix || typeof prefix !== "string") {
        throw new ValidationException(
          "Field 'prefix' is required and must be a string"
        );
      }

      const number = await (sequenceService as SequenceService).getNextNumber(
        prefix
      );
      this.sendData(res, { number });
    } catch (error) {
      next(error);
    }
  };
}
