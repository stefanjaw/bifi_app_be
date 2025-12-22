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
    // this.initCloneShippingRoute();
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
    this.router.post(
      `${this.endpoint}/from-file/:id`,
      this.upload.single("file"),
      authorizeMiddleware(`${this.resource}/from-file/:id`, "create"),
      (this.controller as ShippingController).generateShippingFromFile
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
