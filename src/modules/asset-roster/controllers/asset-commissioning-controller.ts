import { NextFunction, Request, Response } from "express";
import { BaseController, FileValidatorService } from "../../../system";
import { AssetCommissioningDocument } from "@mongodb-types";
import { AssetCommissioningService } from "../services/asset-commissioning-service";

const assetCommissioningService = new AssetCommissioningService();

export class AssetCommissioningController extends BaseController<AssetCommissioningDocument> {
  private fileValidator = new FileValidatorService();
  private acceptedAttarchmentTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ];

  constructor() {
    super({ service: assetCommissioningService });
  }

  protected override async createHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      try {
        for (const file of files) {
          this.fileValidator.validateFileType(
            file,
            this.acceptedAttarchmentTypes,
          );
        }
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.attachments = files;
    } else {
      req.body.attachments = [];
    }

    await super.createHandler(req, res, next);
  }

  protected override async updateHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      try {
        for (const file of files) {
          this.fileValidator.validateFileType(
            file,
            this.acceptedAttarchmentTypes,
          );
        }
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.attachments = files;
    } else {
      req.body.attachments = [];
    }

    await super.updateHandler(req, res, next);
  }

  protected async updateDecommissionHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const body = { ...req.body };
      const record = await (
        this.service as AssetCommissioningService
      ).updateDecommission(body);

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  updateDecommission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    await this.updateDecommissionHandler(req, res, next);
  };
}
