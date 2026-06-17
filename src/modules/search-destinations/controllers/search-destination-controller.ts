import { NextFunction, Request, Response } from "express";
import { BaseController, ValidationException } from "../../../system";
import { SearchDestinationDocument } from "@mongodb-types";
import { SearchDestinationService } from "../services/search-destination-service";

export class SearchDestinationController extends BaseController<SearchDestinationDocument> {
  constructor() {
    super({ service: new SearchDestinationService() });
  }

  private get searchService(): SearchDestinationService {
    return this.service as SearchDestinationService;
  }

  protected async getAllHandler(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const destinations = await this.searchService.getAllActive();
      this.sendData(res, destinations);
    } catch (error) {
      next(error);
    }
  }

  protected async searchHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const q = (req.query.q as string) || "";
      const rawLimit = Number(req.query.limit);
      const limit = Number.isFinite(rawLimit)
        ? Math.max(1, Math.min(100, rawLimit))
        : undefined;
      const results = await this.searchService.search(q, limit);
      this.sendData(res, results);
    } catch (error) {
      next(error);
    }
  }

  protected async syncHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const destinations = req.body?.destinations ?? req.body;
      if (!Array.isArray(destinations)) {
        throw new ValidationException(
          "sync expects an array of destinations (body or body.destinations)"
        );
      }
      const result = await this.searchService.syncDestinations(destinations);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    await this.getAllHandler(req, res, next);
  };

  search = async (req: Request, res: Response, next: NextFunction) => {
    await this.searchHandler(req, res, next);
  };

  sync = async (req: Request, res: Response, next: NextFunction) => {
    await this.syncHandler(req, res, next);
  };
}
