import { NextFunction, Request, Response } from "express";
import { BaseController, FileValidatorService } from "../../../system";
import { productComissioning } from "../models/product-comissioning.model";
import { ProductComissioningService } from "../services/product-comissioning-service";

const productComissioningService = new ProductComissioningService();

export class ProductComissioningController extends BaseController<productComissioning> {
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
    super({ service: productComissioningService });
  }

  protected override async createHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      try {
        for (const file of files) {
          this.fileValidator.validateFileType(
            file,
            this.acceptedAttarchmentTypes
          );
        }
      } catch (error: any) {
        super.sendError(res, 401, error.message);
        return;
      }

      req.body.attachments = files;
    }

    await super.createHandler(req, res, next);
  }

  protected override async updateHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      try {
        for (const file of files) {
          this.fileValidator.validateFileType(
            file,
            this.acceptedAttarchmentTypes
          );
        }
      } catch (error: any) {
        super.sendError(res, 401, error.message);
        return;
      }

      req.body.attachments = files;
    }

    await super.updateHandler(req, res, next);
  }
}
