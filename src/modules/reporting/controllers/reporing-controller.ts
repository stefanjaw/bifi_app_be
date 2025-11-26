import { NextFunction, Request, Response } from "express";
import { ReportingService } from "../services/reporting-service";
import { ValidationException } from "../../../system";

export class ReportingController {
  private reportingService = new ReportingService();

  async getGenerateReportHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const model = req.params.model;

      if (!model) throw new ValidationException("Model is required");

      const pdf = await this.reportingService.generatePDFReport(model);

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
