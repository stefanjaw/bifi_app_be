import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { BaseService } from "../../../system/libraries/base-module/base-service";
import {
  catalogCacheModel,
  CatalogCacheDocument,
} from "../models/catalog-cache.model";
import { PricingIndexingService } from "../services/pricing-indexing-service";
import { PricingSearchService } from "../services/pricing-search-service";

export class PricingIndexController extends BaseController<CatalogCacheDocument> {
  private indexingService = new PricingIndexingService();
  private searchService = new PricingSearchService();

  constructor() {
    super({
      service: new BaseService<CatalogCacheDocument>({
        model: catalogCacheModel,
      }),
    });
  }

  protected async triggerIndexingHandler(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    const type = req.body?.type;
    const force = req.body?.force === true;
    this.indexingService.triggerIndexing(type, force).catch((err) => {
      console.error("Background indexing error:", err.message);
    });
    res.status(202).json({ running: true, message: "Indexing started in background" });
  }

  protected async getStatusHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const status = await this.indexingService.getIndexingStatus();
      this.sendData(res, status);
    } catch (error) {
      next(error);
    }
  }

  protected async textSearchHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const query = req.query.q as string;
      const topN = parseInt(req.query.topN as string) || 10;
      const type = req.query.type as string | undefined;
      const results = await this.searchService.search(
        query || "",
        topN,
        type
      );
      this.sendData(res, results);
    } catch (error) {
      next(error);
    }
  }

  triggerIndexing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    await this.triggerIndexingHandler(req, res, next);
  };

  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    await this.getStatusHandler(req, res, next);
  };

  textSearch = async (req: Request, res: Response, next: NextFunction) => {
    await this.textSearchHandler(req, res, next);
  };

  startSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const intervalHours = parseInt(req.body?.intervalHours) || 1;
      const intervalMs = intervalHours * 60 * 60 * 1000;
      this.indexingService.startScheduledIndexing(intervalMs);
      this.sendData(res, { scheduled: true, intervalHours });
    } catch (error) {
      next(error);
    }
  };

  stopSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.indexingService.stopScheduledIndexing();
      this.sendData(res, { scheduled: false });
    } catch (error) {
      next(error);
    }
  };
}
