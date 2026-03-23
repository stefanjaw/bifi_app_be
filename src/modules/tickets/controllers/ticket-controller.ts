import { TicketDocument } from "@mongodb-types";
import { BaseController, FileValidatorService } from "../../../system";
import { TicketService } from "../services/ticket-service";
import { NextFunction, Request, Response } from "express";

const ticketService = new TicketService();

export class TicketController extends BaseController<TicketDocument> {
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

  protected override async updateHandler(
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
      delete req.body.attachments;
    }

    await super.updateHandler(req, res, next);
  }

  async reportHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const report = await ticketService.generateReport();
      this.sendData(res, report);
    } catch (error) {
      next(error);
    }
  }
}
