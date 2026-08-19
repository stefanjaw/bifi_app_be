import { Router } from "express";
import rateLimit from "express-rate-limit";
import { FileController } from "../controllers/file-controller";
import { createUploadMiddleware } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware } from "../../../system";

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: "Too many upload requests." },
});

export class FileRouter {
  private router = Router();
  private upload = createUploadMiddleware();

  constructor() {
    const controller = new FileController();

    this.router.get(
      "/files/:id",
      authorizeMiddleware("files", "read"),
      controller.getById,
    );
    this.router.post(
      "/files",
      uploadLimiter,
      authorizeMiddleware("files", "create"),
      this.upload.any(),
      controller.uploadFiles,
    );
  }

  get getRouter() {
    return this.router;
  }
}
