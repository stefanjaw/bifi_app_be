import { Request, Response } from "express";
import mongoose from "mongoose";
import { ConnectionManager } from "../../../system";

export class ModelController {
  private connectionManager = new ConnectionManager();

  /**
   * Handles the request to get the list of all the models in the application
   * @param {Request} req - The express request object
   * @param {Response} res - The express response object
   * @returns {Response} - Response object with status 200 and a JSON containing the list of all the models
   */
  protected getModelsListHandle(req: Request, res: Response) {
    const list = this.connectionManager.getModeList();
    res.status(200).json(list);
  }

  getModelsList = (req: Request, res: Response) =>
    this.getModelsListHandle(req, res);
}
