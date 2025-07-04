import { BaseService } from "../../../utils";
import { country, countryModel } from "../models/country";

export class CountryService extends BaseService<country> {
  constructor() {
    super(countryModel);
  }
}
