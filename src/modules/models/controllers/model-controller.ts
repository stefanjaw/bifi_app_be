import { Request, Response } from "express";
import mongoose from "mongoose";

export class ModelController {
  protected getModelsListHandle(req: Request, res: Response) {
    const list = mongoose.modelNames();
    res.status(200).json(list);
  }

  getModelsList = (req: Request, res: Response) =>
    this.getModelsListHandle(req, res);
}
