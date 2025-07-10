import { BaseService } from "../../../system";
import { country, countryModel } from "../models/country.model";

export class CountryService extends BaseService<country> {
  constructor() {
    super({ model: countryModel });
  }
}
