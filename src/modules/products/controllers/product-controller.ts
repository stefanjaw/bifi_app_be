import { Request, Response } from "express";
import { BaseController, Validator } from "../../../utils";
import { product } from "../models/product";
import { ProductService } from "../services/product-service";

const productService = new ProductService();

export class ProductController extends BaseController<product> {
  validator = new Validator();

  constructor() {
    super(productService);
    super.setParsingFields = [
      { key: "productTypeIds", type: "array" },
      { key: "vendorIds", type: "array" },
      { key: "maintenanceWindowIds", type: "array" },
      { key: "locationId", type: "object" },
    ];
  }

  protected override async createHandler(
    req: Request,
    res: Response
  ): Promise<void> {
    const file = (req.files as Express.Multer.File[])[0]; // Assuming the first file is the photo

    if (file) {
      try {
        this.validator.validateImageFile(file);
      } catch (error: any) {
        super.sendError(res, 401, error.message);
        return;
      }

      req.body.photo = file;
    }

    await super.createHandler(req, res);
  }

  protected override async updateHandler(
    req: Request,
    res: Response
  ): Promise<void> {
    const file = (req.files as Express.Multer.File[])[0]; // Assuming the first file is the photo

    if (file) {
      try {
        this.validator.validateImageFile(file);
      } catch (error: any) {
        super.sendError(res, 401, error.message);
        return;
      }

      req.body.photo = file;
    }

    await super.updateHandler(req, res);
  }
}
