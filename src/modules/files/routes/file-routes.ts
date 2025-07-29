import { Router } from "express";
import { FileController } from "../controllers/file-controller";
import multer from "multer";

export class FileRouter {
  private router = Router();
  private upload = multer();

  constructor() {
    const controller = new FileController();

    this.router.get("/files/:id", controller.getById);
    this.router.post("/files", this.upload.any(), controller.uploadFiles);
  }

  get getRouter() {
    return this.router;
  }
}
