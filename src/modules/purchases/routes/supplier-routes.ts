import { Router } from "express";
import { SupplierController } from "../controllers/supplier-controller";
import { authorizeMiddleware } from "../../../system/middlewares";

const supplierController = new SupplierController();

export class SupplierRouter {
  private router = Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/purchases/suppliers",
      authorizeMiddleware("purchases/suppliers", "read"),
      supplierController.getAll
    );
    this.router.get(
      "/purchases/suppliers/:id",
      authorizeMiddleware("purchases/suppliers", "read"),
      supplierController.getById
    );
  }

  get getRouter() {
    return this.router;
  }
}
