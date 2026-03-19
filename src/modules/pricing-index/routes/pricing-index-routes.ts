import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { PricingIndexController } from "../controllers/pricing-index-controller";
import {
  PricingIndexSearchDTO,
  PricingIndexTriggerDTO,
} from "../models/pricing-index.dto";
import { CatalogCacheDocument } from "../models/catalog-cache.model";

const pricingIndexController = new PricingIndexController();

export class PricingIndexRouter extends BaseRoutes<CatalogCacheDocument> {
  constructor() {
    super({
      controller: pricingIndexController,
      endpoint: "/pricing-index",
      dtoCreateClass: PricingIndexTriggerDTO,
      dtoUpdateClass: PricingIndexTriggerDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/pricing-index/status",
      authorizeMiddleware("pricing-index", "read"),
      pricingIndexController.getStatus,
    );

    this.router.get(
      "/pricing-index/text-search",
      authorizeMiddleware("pricing-index", "read"),
      pricingIndexController.textSearch,
    );

    this.router.get(
      "/pricing-index",
      authorizeMiddleware("pricing-index", "read"),
      pricingIndexController.get,
    );

    this.router.post(
      "/pricing-index/trigger",
      authorizeMiddleware("pricing-index", "create"),
      validateBodyMiddleware(PricingIndexTriggerDTO),
      pricingIndexController.triggerIndexing,
    );

    this.router.post(
      "/pricing-index/schedule/start",
      authorizeMiddleware("pricing-index", "create"),
      pricingIndexController.startSchedule,
    );

    this.router.post(
      "/pricing-index/schedule/stop",
      authorizeMiddleware("pricing-index", "create"),
      pricingIndexController.stopSchedule,
    );
  }
}
