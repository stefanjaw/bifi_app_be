import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { PricingEstimateService } from "../services/pricing-estimate-service";
import { PricingEngineService } from "../services/pricing-engine-service";
import { PricingSettingsService } from "../services/pricing-settings-service";
import { PdfGeneratorService } from "../services/pdf-generator-service";
import { CsvGeneratorService } from "../services/csv-generator-service";
import { PricingEstimateDocument } from "../models/pricing-estimate.model";

const pricingEstimateService = new PricingEstimateService();
const pricingEngineService = new PricingEngineService();
const pricingSettingsService = new PricingSettingsService();
const pdfGeneratorService = new PdfGeneratorService();
const csvGeneratorService = new CsvGeneratorService();

export class PricingEstimateController extends BaseController<PricingEstimateDocument> {
  constructor() {
    super({ service: pricingEstimateService });
  }

  generateEstimate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { requestText, shippingMethod, pricingControls, specialInstructions, preparedBy } =
        req.body;

      const estimateResult = await pricingEngineService.calculateEstimate({
        requestText,
        shippingMethod,
        pricingControls,
        specialInstructions,
      });

      const record = await pricingEstimateService.create(
        {
          requestText,
          shippingMethod,
          pricingControls,
          specialInstructions,
          preparedBy,
          status: "generated",
          ...estimateResult,
        },
        undefined
      );

      this.sendData(res, record);
    } catch (error) {
      next(error);
    }
  };

  tokenEstimate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestText } = req.body;
      const estimation = await pricingEngineService.tokenEstimate(requestText);
      this.sendData(res, estimation);
    } catch (error) {
      next(error);
    }
  };

  exportPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const record = (await pricingEstimateService.getById(
        id,
        undefined
      )) as PricingEstimateDocument;

      if (!record) {
        res.status(404).json({ message: "Estimate not found" });
        return;
      }

      const pdfBuffer = await pdfGeneratorService.generate(record);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=estimate-${record.number ?? id}.pdf`
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  exportCsv = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const record = (await pricingEstimateService.getById(
        id,
        undefined
      )) as PricingEstimateDocument;

      if (!record) {
        res.status(404).json({ message: "Estimate not found" });
        return;
      }

      const csvBuffer = csvGeneratorService.generate(record);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=estimate-${record.number ?? id}.csv`
      );
      res.send(csvBuffer);
    } catch (error) {
      next(error);
    }
  };

  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await pricingSettingsService.getSettings();
      this.sendData(res, settings);
    } catch (error) {
      next(error);
    }
  };

  upsertSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await pricingSettingsService.upsertSettings(req.body);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
