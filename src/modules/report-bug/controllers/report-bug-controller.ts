import { TicketDocument } from "@mongodb-types";
import { BaseController, FileValidatorService } from "../../../system";
import { TicketService } from "../../tickets/services/ticket-service";
import { NextFunction, Request, Response } from "express";

const ticketService = new TicketService();

export class ReportBugController extends BaseController<TicketDocument> {
  private fileValidator = new FileValidatorService();

  constructor() {
    super({ service: ticketService });
  }

  protected override async createHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      try {
        for (const file of files) {
          this.fileValidator.validateMaxSize(file);
        }
      } catch (error: any) {
        next(error);
        return;
      }
      req.body.attachments = files;
    } else {
      req.body.attachments = [];
    }

    await super.createHandler(req, res, next);
  }
}
