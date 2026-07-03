import { ReportingController } from "../controllers/reporing-controller";
import { authorizeMiddleware, BaseRoutes } from "../../../system";
import { ReportingDocument } from "@mongodb-types";
import { ReportingDTO, UpdateReportingDTO } from "../models/reporting.dto";

const reportingController = new ReportingController();

export class ReportingRouter extends BaseRoutes<ReportingDocument> {
  constructor() {
    super({
      controller: reportingController,
      endpoint: "/reporting",
      dtoCreateClass: ReportingDTO,
      dtoUpdateClass: UpdateReportingDTO,
    });
  }

  protected override initRoutes(): void {
    this.initGenerateReportingRoute();
    super.initRoutes();
  }

  initGenerateReportingRoute() {
    this.router.get(
      `${this.endpoint}/generate-report`,
      authorizeMiddleware("reporting/generate-report", "read"),
      reportingController.getGenerateReport,
    );
  }
}
