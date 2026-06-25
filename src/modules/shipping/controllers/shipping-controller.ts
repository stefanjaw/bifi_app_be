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
      const files = req.files as Express.Multer.File[];
      const id: string | undefined = req.params.id;

      if (!files) throw new ValidationException("File is required");
      files.forEach((file) => this.fileValidatorService.validatePDFFile(file));

      const record = await (
        this.service as ShippingService
      ).generateShippingFromFiles(files, id);

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  protected async generateHSCodesForShippingHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const record = await (
        this.service as ShippingService
      ).generateHSCodesForShipping(req.body);

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  protected async generateTariffForShippingHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const record = await (
        this.service as ShippingService
      ).generateTariffForShipping(req.body);

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  cloneShipping = async (req: Request, res: Response, next: NextFunction) => {
    await this.cloneShippingHandler(req, res, next);
  };

  generateShippingFromFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    await this.generateShippingFromFileHandler(req, res, next);
  };

  generateHSCodesForShipping = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    await this.generateHSCodesForShippingHandler(req, res, next);
  };

  generateTariffForShipping = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    await this.generateTariffForShippingHandler(req, res, next);
  };
}
