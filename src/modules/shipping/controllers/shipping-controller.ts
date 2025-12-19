import { ShippingDocument } from "@mongodb-types";
import {
  BaseController,
  FileValidatorService,
  ValidationException,
} from "../../../system";
import { ShippingService } from "../services/shipping-service";
import { NextFunction, Request, Response } from "express";

export class ShippingController extends BaseController<ShippingDocument> {
  private readonly fileValidatorService = new FileValidatorService();

  constructor() {
    super({
      service: new ShippingService(),
    });
  }

  protected async cloneShippingHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id;
      const record = await (this.service as ShippingService).cloneShipping(id);
      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  protected async generateShippingFromFileHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const file = req.file;

      if (!file) throw new ValidationException("File is required");
      this.fileValidatorService.validatePDFFile(file);

      const record = await (
        this.service as ShippingService
      ).generateShippingFromFile(file);
      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  generateShippingFromFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    await this.generateShippingFromFileHandler(req, res, next);
  };

  cloneShipping = async (req: Request, res: Response, next: NextFunction) => {
    await this.cloneShippingHandler(req, res, next);
  };
}
