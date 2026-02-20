import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system";
import { CountryDocument } from "../../../types/mongoose.gen";
import { CountryService } from "../services/country-service";

const countryService = new CountryService();

export class CountryController extends BaseController<CountryDocument> {
  constructor() {
    super({ service: countryService });
  }

  /**
   * Endpoint handler to populate countries from a remote source.
   * @param {Request} req - The incoming request.
   * @param {Response} res - The outgoing response.
   * @param {NextFunction} next - The next middleware to call.
   * @returns {Promise<void>} - A promise that resolves when the operation completes.
   */
  protected async createPopulateCountriesHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const records = await countryService.populateCountries(undefined);
      this.sendData(res, records);
    } catch (error: any) {
      next(error);
    }
  }

  // Public method to be used as an endpoint handler
  createPopulateCountries = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    await this.createPopulateCountriesHandler(req, res, next);
  };
}
