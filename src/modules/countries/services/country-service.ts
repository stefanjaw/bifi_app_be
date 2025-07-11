import { BaseService } from "../../../system";
import { CountryDocument } from "../../../types/mongoose.gen";
import { countryModel } from "../models/country.model";

export class CountryService extends BaseService<CountryDocument> {
  constructor() {
    super({ model: countryModel });
  }
}
