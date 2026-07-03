import { Router } from "express";
import { ModelController } from "../controllers/model-controller";
import { authorizeMiddleware } from "../../../system";

export class ModelRouter {
  private router = Router();

  constructor() {
    const controller = new ModelController();

    this.router.get(
      "/models",
      authorizeMiddleware("models", "read"),
      controller.getModelsList,
    );
  }

  get getRouter() {
    return this.router;
  }
}
