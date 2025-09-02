import { NextFunction, Request, Response } from "express";
import { BaseController, FileValidatorService } from "../../../system";
import { ProductService } from "../services/product-service";
import { ProductDocument } from "../../../types/mongoose.gen";

const productService = new ProductService();

export class ProductController extends BaseController<ProductDocument> {
  fileValidator = new FileValidatorService();

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
    super({ service: productService });
  }

  protected override async createHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const files = req.files as
      | { photo?: Express.Multer.File[]; attachments?: Express.Multer.File[] }
      | undefined;

    const photo = files?.photo?.[0];
    const attachments = files?.attachments;

    if (photo) {
      try {
        this.fileValidator.validateImageFile(photo);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.photo = photo;
    }

    if (attachments) {
      try {
        for (const attachment of attachments) {
          this.fileValidator.validateFileType(
            attachment,
            this.acceptedAttarchmentTypes
          );
        }
      } catch (error: any) {
        next(error);
        return;
      }
    }

    await super.createHandler(req, res, next);
  }

  protected override async updateHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const files = req.files as
      | { photo?: Express.Multer.File[]; attachments?: Express.Multer.File[] }
      | undefined;

    const photo = files?.photo?.[0];
    const attachments = files?.attachments;

    if (photo) {
      try {
        this.fileValidator.validateImageFile(photo);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.photo = photo;
    }

    if (attachments) {
      try {
        for (const attachment of attachments) {
          this.fileValidator.validateFileType(
            attachment,
            this.acceptedAttarchmentTypes
          );
        }

        req.body.attachments = attachments;
      } catch (error: any) {
        next(error);
        return;
      }
    }

    await super.updateHandler(req, res, next);
  }
}
