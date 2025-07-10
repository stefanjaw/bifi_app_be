import { NextFunction, Request, Response } from "express";
import { BaseController, FileValidatorService } from "../../../system";
import { ProductService } from "../services/product-service";
import { ProductDocument } from "../../../types/mongoose.gen";

const productService = new ProductService();

export class ProductController extends BaseController<ProductDocument> {
  fileValidator = new FileValidatorService();

  constructor() {
    super({ service: productService });
  }

  protected override async createHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const file = (req.files as Express.Multer.File[])[0]; // Assuming the first file is the photo

    if (file) {
      try {
        this.fileValidator.validateImageFile(file);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.photo = file;
    }

    await super.createHandler(req, res, next);
  }

  protected override async updateHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const file = (req.files as Express.Multer.File[])[0]; // Assuming the first file is the photo

    if (file) {
      try {
        this.fileValidator.validateImageFile(file);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.photo = file;
    }

    await super.updateHandler(req, res, next);
  }
}
