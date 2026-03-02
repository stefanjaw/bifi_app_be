import { Router } from "express";
import { authorizeMiddleware } from "../../../system";
import { SalesController } from "../controllers/sales-controller";

const salesController = new SalesController();

export class SalesRouter {
  private router = Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/sales/dashboard",
      authorizeMiddleware("sales", "read"),
      salesController.getDashboard
    );
  }

  get getRouter() {
    return this.router;
  }
}
