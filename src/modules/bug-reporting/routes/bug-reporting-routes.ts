import { Router } from "express";
import { BugReportingController } from "../controllers/bug-reporting-controller";
import { BugDTO } from "../models/bug.dto";
import multer from "multer";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";

export class BugReportingRouter {
  private readonly bugReportingController = new BugReportingController();
  private readonly router = Router();
  private readonly upload = multer();
  private readonly dtoCreateClass = BugDTO;

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.initCreateRoute();
  }

  get getRouter() {
    return this.router;
  }

  private initCreateRoute() {
    this.router.post(
      "/bug-report",
      this.upload.array("files"),
      validateBodyMiddleware(this.dtoCreateClass),
      authorizeMiddleware("bug-report", "create"),
      this.bugReportingController.create
    );
  }
}
