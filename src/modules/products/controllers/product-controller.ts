import { Request, Response } from "express";
import { BaseController } from "../../../utils";
import { product } from "../models/product";
import { ProductService } from "../services/product-service";

const productService = new ProductService();

export class ProductController extends BaseController<product> {
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
      // Assuming the first file is the photo
      if (!file.mimetype.startsWith("image/")) {
        res.status(400).json({ error: "Uploaded file is not a valid image" });
        return;
      }

      // check size of the file
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        res.status(400).json({ error: "File size exceeds the limit of 5MB" });
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
      // Assuming the first file is the photo
      if (!file.mimetype.startsWith("image/")) {
        res.status(400).json({ error: "Uploaded file is not a valid image" });
        return;
      }

      // check size of the file
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        res.status(400).json({ error: "File size exceeds the limit of 5MB" });
        return;
      }

      req.body.photo = file;
    }

    await super.updateHandler(req, res);
  }
}
