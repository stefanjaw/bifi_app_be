import { CustomsTariffDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { CustomsTariffService } from "../services/customs-tariff.services";
import { NextFunction, Request, Response } from "express";

export class CustomsTariffController extends BaseController<CustomsTariffDocument> {
  protected tariffService: CustomsTariffService;

  constructor() {
    const service = new CustomsTariffService();
    super({ service });
    this.tariffService = service;
  }

  lookup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chapter, heading, subheading, code } = req.query as Record<
        string,
        string
      >;

      let result: CustomsTariffDocument | null = null;

      if (code) {
        result = await this.tariffService.lookupByCode(code);
      } else if (chapter && heading && subheading) {
        result = await this.tariffService.lookupByParts(
          chapter,
          heading,
          subheading
        );
      }

      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };
}
