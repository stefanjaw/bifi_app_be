import { BaseService } from "../../../system";
import { country, countryModel } from "../models/country";

export class CountryService extends BaseService<country> {
  constructor() {
    super({ model: countryModel });
  }
}
