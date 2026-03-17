import { BaseRoutes } from "../../../system";
import { PricingEstimateController } from "../controllers/pricing-estimate-controller";
import { PricingEstimateDocument } from "../models/pricing-estimate.model";
import {
  PricingEstimateCreateDTO,
  PricingEstimateUpdateDTO,
  GenerateEstimateDTO,
  TokenEstimateDTO,
} from "../models/pricing-estimate.dto";
import { PricingSettingsDTO } from "../models/pricing-settings.dto";
import {
  authorizeMiddleware,
  validateBodyMiddleware,
} from "../../../system/middlewares";

const controller = new PricingEstimateController();

export class PricingEstimateRouter extends BaseRoutes<PricingEstimateDocument> {
  constructor() {
    super({
      controller,
      endpoint: "/pricing-estimates",
      dtoCreateClass: PricingEstimateCreateDTO,
      dtoUpdateClass: PricingEstimateUpdateDTO,
    });
  }

  protected override initRoutes() {
    this.router.post(
      "/pricing-estimates/generate",
      this.upload.any(),
      validateBodyMiddleware(GenerateEstimateDTO),
      authorizeMiddleware("pricing-estimates", "create"),
      controller.generateEstimate
    );

    this.router.post(
      "/pricing-estimates/token-estimate",
      this.upload.any(),
      validateBodyMiddleware(TokenEstimateDTO),
      authorizeMiddleware("pricing-estimates", "read"),
      controller.tokenEstimate
    );

    this.router.get(
      "/pricing-estimates/:id/pdf",
      authorizeMiddleware("pricing-estimates", "read"),
      controller.exportPdf
    );

    this.router.get(
      "/pricing-estimates/:id/csv",
      authorizeMiddleware("pricing-estimates", "read"),
      controller.exportCsv
    );

    this.router.get(
      "/pricing-settings",
      authorizeMiddleware("pricing-settings", "read"),
      controller.getSettings
    );

    this.router.put(
      "/pricing-settings",
      this.upload.any(),
      validateBodyMiddleware(PricingSettingsDTO),
      authorizeMiddleware("pricing-settings", "update"),
      controller.upsertSettings
    );

    super.initRoutes();
  }
}
