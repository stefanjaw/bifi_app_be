import { ShippingDocument } from "@mongodb-types";
import {
  authorizeMiddleware,
  BaseRoutes,
  validateBodyMiddleware,
} from "../../../system";
import { ShippingController } from "../controllers/shipping-controller";
import { ShippingDTO, UpdateShippingDTO } from "../models/shipping.dto";
import { HScodeDTO } from "../models/hs-code.dto";

export class ShippingRouter extends BaseRoutes<ShippingDocument> {
  constructor() {
    super({
      controller: new ShippingController(),
      endpoint: "/shippings",
      dtoCreateClass: ShippingDTO,
      dtoUpdateClass: UpdateShippingDTO,
    });
  }

  override initRoutes() {
    this.initGenerateShippingFromFileRoute();
    this.initRegenerateShippingFromFileRoute();
    this.initGenerateHSCodesForShippingRoute();
    this.initGenerateTariffForShippingRoute();
    super.initRoutes();
  }

  initGenerateShippingFromFileRoute() {
    this.router.post(
      `${this.endpoint}/from-file`,
      this.upload.array("files"),
      authorizeMiddleware(`${this.resource}/from-file`, "create"),
      (this.controller as ShippingController).generateShippingFromFile
    );
  }

  initRegenerateShippingFromFileRoute() {
    this.router.put(
      `${this.endpoint}/from-file/:id`,
      this.upload.array("files"),
      authorizeMiddleware(`${this.resource}/from-file/:id`, "update"),
      (this.controller as ShippingController).generateShippingFromFile
    );
  }

  initGenerateHSCodesForShippingRoute() {
    this.router.post(
      `${this.endpoint}/hs-code/generate`,
      this.upload.any(),
      validateBodyMiddleware(HScodeDTO),
      authorizeMiddleware(`${this.resource}/hs-code/generate/:id`, "update"),
      (this.controller as ShippingController).generateHSCodesForShipping
    );
  }

  initGenerateTariffForShippingRoute() {
    this.router.post(
      `${this.endpoint}/tariff/generate`,
      this.upload.any(),
      validateBodyMiddleware(HScodeDTO),
      authorizeMiddleware(`${this.resource}/tariff/generate/:id`, "update"),
      (this.controller as ShippingController).generateTariffForShipping
    );
  }
}
