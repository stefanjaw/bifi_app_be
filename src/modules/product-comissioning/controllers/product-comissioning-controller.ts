import { NextFunction, Request, Response } from "express";
import { BaseController, FileValidatorService } from "../../../system";
import { ProductComissioningService } from "../services/product-comissioning-service";
import { ProductComissioningDocument } from "../../../types/mongoose.gen";

const productComissioningService = new ProductComissioningService();

export class ProductComissioningController extends BaseController<ProductComissioningDocument> {
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
        next(error);
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
        next(error);
        return;
      }

      req.body.attachments = files;
    }

    await super.updateHandler(req, res, next);
  }

  /**
   * Updates a product comissioning with the given data and marks it as decommissioned.
   * It also updates the product's status to "decommissioned".
   * Additionally, it adds an activity history record for the decomissioning event.
   * @param req - The express Request object containing the data to update the product comissioning with.
   * @param res - The express Response object used to send data back to the client.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   */
  protected async updateDecomissionHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const body = { ...req.body };
      const record = await (
        this.service as ProductComissioningService
      ).updateDecomission(body);

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  updateDecomission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    await this.updateDecomissionHandler(req, res, next);
  };
}
