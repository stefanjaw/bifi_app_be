import { Router } from "express";
import { FileController } from "../controllers/file-controller";
import multer from "multer";
import { authorizeMiddleware } from "../../../system";

export class FileRouter {
  private router = Router();
  private upload = multer();

  constructor() {
    const controller = new FileController();

    this.router.get(
      "/files/:id",
      authorizeMiddleware("files/:id", "read"),
      controller.getById
    );
    this.router.post(
      "/files",
      this.upload.any(),
      authorizeMiddleware("files", "create"),
      controller.uploadFiles
    );
  }

  get getRouter() {
    return this.router;
  }
}
