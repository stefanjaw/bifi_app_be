import { BaseController } from "../../../../system";
import { ProgressNoteDocument } from "@mongodb-types";
import { ProgressNoteService } from "../services/progress-note-service";
import { Request, Response, NextFunction } from "express";

const progressNoteService = new ProgressNoteService();

/** Express controller for progress note CRUD operations */
export class ProgressNoteController extends BaseController<ProgressNoteDocument> {
  constructor() {
    super({ service: progressNoteService });
  }

  /** Adds a user to the read-by list */
  addUserReadBy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await (
        this.service as ProgressNoteService
      ).addUserReadBy(req.params.id, req.body.userId);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  /** Removes a user from the read-by list */
  removeUserReadBy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await (
        this.service as ProgressNoteService
      ).removeUserReadBy(req.params.id, req.body.userId);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
