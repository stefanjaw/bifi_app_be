import { CustomsTariffDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { CustomsTariffController } from "../controllers/customs-tariff.controller";
import {
  CustomsTariffDTO,
  UpdateCustomsTariffDTO,
} from "../models/customs-tariff.dto";
import { authorizeMiddleware } from "../../../system";

export class CustomsTariffRouter extends BaseRoutes<CustomsTariffDocument> {
  constructor() {
    super({
      controller: new CustomsTariffController(),
      endpoint: "/customs-tariffs",
      dtoCreateClass: CustomsTariffDTO,
      dtoUpdateClass: UpdateCustomsTariffDTO,
    });
  }

  protected initRoutes() {
    this.initLookupRoute();
    super.initRoutes();
  }

  private initLookupRoute() {
    this.router.get(
      "/customs-tariffs/lookup",
      authorizeMiddleware("customs-tariffs", "read"),
      (req, res, next) =>
        (this.controller as CustomsTariffController).lookup(req, res, next)
    );
  }
}
