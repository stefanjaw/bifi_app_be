import { TicketDocument } from "@mongodb-types";
import { BaseRoutes, validateBodyMiddleware } from "../../../system";
import { ReportBugController } from "../controllers/report-bug-controller";
import { BugReportDTO } from "../models/bug-report.dto";

const reportBugController = new ReportBugController();

export class ReportBugRouter extends BaseRoutes<TicketDocument> {
  constructor() {
    super({
      controller: reportBugController,
      endpoint: "/report-bug",
      dtoCreateClass: BugReportDTO,
      dtoUpdateClass: BugReportDTO,
    });
  }

  protected override initRoutes(): void {
    this.router.post(
      this.endpoint,
      this.upload.any(),
      validateBodyMiddleware(this.dtoCreateClass),
      this.controller.create,
    );
  }
}
