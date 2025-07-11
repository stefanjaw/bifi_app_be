import { BaseController } from "../../../system";
import { CountryDocument } from "../../../types/mongoose.gen";
import { CountryService } from "../services/country-service";

const countryService = new CountryService();

export class CountryController extends BaseController<CountryDocument> {
  constructor() {
    super({ service: countryService });
  }
}
