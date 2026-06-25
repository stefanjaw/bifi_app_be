import { Router } from "express";
import multer from "multer";
import {
  authorizeMiddleware,
  validateBodyMiddleware,
} from "../../../../system";
import { GemsController } from "../controllers/gems-controller";
import { GemsDTO, GemsEmbedDTO } from "../models/gems.dto";

export class GemsRouter {
  private router = Router();
  private upload = multer();
  private controller = new GemsController();

  constructor() {
    this.router.post(
      "/gems/generate",
      this.upload.array("files"),
      validateBodyMiddleware(GemsDTO),
      authorizeMiddleware("gems/generate", "create"),
      this.controller.generate
    );

    this.router.post(
      "/gems/generate-stream",
      this.upload.array("files"),
      validateBodyMiddleware(GemsDTO),
      authorizeMiddleware("gems/generate-stream", "create"),
      this.controller.generateStream
    );

    this.router.post(
      "/gems/embed",
      validateBodyMiddleware(GemsEmbedDTO),
      authorizeMiddleware("gems/embed", "create"),
      this.controller.embed
    );
  }

  get getRouter() {
    return this.router;
  }
}
