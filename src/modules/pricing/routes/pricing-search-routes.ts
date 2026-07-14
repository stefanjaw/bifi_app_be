import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { PricingIndexController } from "../controllers/pricing-search-controller";
import {
  PricingIndexSearchDTO,
  PricingIndexTriggerDTO,
} from "../models/pricing-search.dto";
import { CatalogCacheDocument } from "../models/catalog-cache.model";

const pricingIndexController = new PricingIndexController();

export class PricingIndexRouter extends BaseRoutes<CatalogCacheDocument> {
  constructor() {
    super({
      controller: pricingIndexController,
      endpoint: "/pricing-search",
      dtoCreateClass: PricingIndexTriggerDTO,
      dtoUpdateClass: PricingIndexTriggerDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/pricing-search/status",
      authorizeMiddleware("pricing-search", "read"),
      pricingIndexController.getStatus,
    );

    this.router.get(
      "/pricing-search/text-search",
      authorizeMiddleware("pricing-search", "read"),
      pricingIndexController.textSearch,
    );

    this.router.get(
      "/pricing-search",
      authorizeMiddleware("pricing-search", "read"),
      pricingIndexController.get,
    );

    this.router.post(
      "/pricing-search/trigger",
      authorizeMiddleware("pricing-search", "create"),
      validateBodyMiddleware(PricingIndexTriggerDTO),
      pricingIndexController.triggerIndexing,
    );

    this.router.post(
      "/pricing-search/schedule/start",
      authorizeMiddleware("pricing-search", "create"),
      pricingIndexController.startSchedule,
    );

    this.router.post(
      "/pricing-search/schedule/stop",
      authorizeMiddleware("pricing-search", "create"),
      pricingIndexController.stopSchedule,
    );
  }
}
