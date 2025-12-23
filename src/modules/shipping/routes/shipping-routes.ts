import { ShippingDocument } from "@mongodb-types";
import { authorizeMiddleware, BaseRoutes } from "../../../system";
import { ShippingController } from "../controllers/shipping-controller";
import { ShippingDTO, UpdateShippingDTO } from "../models/shipping.dto";

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
    super.initRoutes();
  }

  initGenerateShippingFromFileRoute() {
    this.router.post(
      `${this.endpoint}/from-file`,
      this.upload.single("file"),
      authorizeMiddleware(`${this.resource}/from-file`, "create"),
      (this.controller as ShippingController).generateShippingFromFile
    );
  }

  initRegenerateShippingFromFileRoute() {
    this.router.put(
      `${this.endpoint}/from-file/:id`,
      this.upload.single("file"),
      authorizeMiddleware(`${this.resource}/from-file/:id`, "update"),
      (this.controller as ShippingController).generateShippingFromFile
    );
  }

  initGenerateHSCodesForShippingRoute() {
    this.router.put(
      `${this.endpoint}/hs-code/generate/:id`,
      authorizeMiddleware(`${this.resource}/hs-code/generate/:id`, "update"),
      (this.controller as ShippingController).generateHSCodesForShipping
    );
  }

  // initCloneShippingRoute() {
  //   this.router.post(
  //     `${this.endpoint}/clone/:id}`,
  //     authorizeMiddleware(`${this.resource}/clone/:id`, "create"),
  //     (this.controller as ShippingController).cloneShipping
  //   );
  // }
}
