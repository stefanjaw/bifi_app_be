import { Router } from "express";
import { authorizeMiddleware } from "../../../system";
import { GlController } from "../controllers/gl-controller";

const glController = new GlController();

/** Router for the GL sweep actions (Phase B2) */
export class GlRouter {
  private router = Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/accounting/gl/post-pending",
      authorizeMiddleware("accounting/gl", "update"),
      (
        req: import("express").Request,
        res: import("express").Response,
        next: import("express").NextFunction,
      ) => glController.postPendingHandler(req, res, next),
    );
  }

  get getRouter() {
    return this.router;
  }
}
