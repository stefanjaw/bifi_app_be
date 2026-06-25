import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { PurchaseSuppliersService } from "../services/supplier-service";
import { ContactDocument } from "@mongodb-types";

export class SupplierController extends BaseController<ContactDocument> {
  constructor() {
    super({ service: new PurchaseSuppliersService() });
  }

  protected async getAllHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const searchParams = req.query.searchParams
        ? JSON.parse(req.query.searchParams as string)
        : {};
      const paginationOptions = req.query.paginationOptions
        ? JSON.parse(req.query.paginationOptions as string)
        : {};

      const result = await (this.service as PurchaseSuppliersService).getAll(
        searchParams,
        paginationOptions
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  protected async getSupplierByIdHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await (
        this.service as PurchaseSuppliersService
      ).getSupplierById(req.params.id);
      if (!result) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    await this.getAllHandler(req, res, next);
  };

  getSupplierById = async (req: Request, res: Response, next: NextFunction) => {
    await this.getSupplierByIdHandler(req, res, next);
  };
}
