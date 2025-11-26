import { Router } from "express";
import { ReportingController } from "../controllers/reporing-controller";
import { authorizeMiddleware } from "../../../system";

export class ReportingRouter {
  private router = Router();
  private reportingController = new ReportingController();

  constructor() {
    this.router.get(
      "/reporting/:model",
      //   authorizeMiddleware("reporting/:model", "read"),
      this.reportingController.getGenerateReport
    );
  }

  get getRouter() {
    return this.router;
  }
}
