import { BaseController } from "../../../system";
import { JournalEntryDocument } from "../models/journal-entry.model";
import { JournalEntryService } from "../services/journal-entry-service";
import { NextFunction, Request, Response } from "express";

const journalEntryService = new JournalEntryService();

export class JournalEntryController extends BaseController<JournalEntryDocument> {
  constructor() {
    super({ service: journalEntryService });
  }

  async postEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const result = await journalEntryService.post(id);
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  }
}
