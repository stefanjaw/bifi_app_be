import { Router } from "express";
import multer from "multer";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { GenAIController } from "../controllers/genai-controller";
import { GenAIDTO } from "../models/genai.dto";

export class GenAIRouter {
  private router = Router();
  private upload = multer();
  private controller = new GenAIController();

  constructor() {
    this.router.post(
      "/genai/generate",
      this.upload.array("files"),
      validateBodyMiddleware(GenAIDTO),
      authorizeMiddleware("genai/generate", "create"),
      this.controller.generate,
    );

    this.router.post(
      "/genai/generate-stream",
      this.upload.array("files"),
      validateBodyMiddleware(GenAIDTO),
      authorizeMiddleware("genai/generate-stream", "create"),
      this.controller.generateStream,
    );
  }

  get getRouter() {
    return this.router;
  }
}
