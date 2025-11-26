import { NextFunction, Request, Response } from "express";
import { ReportingService } from "../services/reporting-service";
import { BaseController, ValidationException } from "../../../system";
import { ReportingDocument } from "@mongodb-types";

const reportingService = new ReportingService();

export class ReportingController extends BaseController<ReportingDocument> {
  constructor() {
    super({ service: reportingService });
  }

  protected async getGenerateReportHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const model = req.query.model as string | undefined;
      const reportId = req.query.reportId as string | undefined;

      if (!model && !reportId)
        throw new ValidationException("Either model or reportId must be sent");

      const pdf = await reportingService.generatePDFReport(model, reportId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${model}.pdf`);
      res.setHeader("Content-Length", pdf.length);

      res.write(pdf);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  getGenerateReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    await this.getGenerateReportHandler(req, res, next);
  };
}
