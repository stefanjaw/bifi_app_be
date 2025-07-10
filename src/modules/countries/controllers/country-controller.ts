import { BaseController } from "../../../system";
import { country } from "../models/country";
import { CountryService } from "../services/country-service";

const countryService = new CountryService();

export class CountryController extends BaseController<country> {
  constructor() {
    super({ service: countryService });
  }
}
