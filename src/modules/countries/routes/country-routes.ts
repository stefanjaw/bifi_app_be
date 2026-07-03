import { authorizeMiddleware, BaseRoutes } from "../../../system";
import { CountryDocument } from "../../../types/mongoose.gen";
import { CountryController } from "../controllers/country-controller";
import { CountryDTO, UpdateCountryDTO } from "../models/country.dto";

const countryController = new CountryController();

export class CountryRouter extends BaseRoutes<CountryDocument> {
  constructor() {
    super({
      controller: countryController,
      endpoint: "/countries",
      dtoCreateClass: CountryDTO,
      dtoUpdateClass: UpdateCountryDTO,
    });

    this.initPostPopulateCountriesRoute();
  }

  initPostPopulateCountriesRoute() {
    this.router.post(
      this.endpoint + "/populate",
      authorizeMiddleware("countries/populate", "create"),
      (this.controller as CountryController).createPopulateCountries,
    );
  }
}
