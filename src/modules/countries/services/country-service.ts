import { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { CountryDocument } from "../../../types/mongoose.gen";
import { countryModel } from "../models/country.model";
import axios from "axios";

export class CountryService extends BaseService<CountryDocument> {
  constructor() {
    super({ model: countryModel });
  }

  /**
   * Populate the countries collection with data from an external API.
   * @param {string | undefined} dbName - The name of the database to use.
   * @param {ClientSession | undefined} session - The MongoDB session to use.
   * @returns {Promise<CountryDocument[]>} - A promise that resolves to an array of CountryDocument objects, representing the newly created or updated countries.
   */
  async populateCountries(session: ClientSession | undefined) {
    return await runTransaction<CountryDocument[]>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        // FETCH COUNTRIES FROM EXTERNAL API
        const countries = await axios.get(
          "https://www.apicountries.com/countries"
        );

        // MAP THE DATA TO MATCH THE COUNTRY SCHEMA
        const formattedCountries = countries.data.map((country: any) => ({
          name: country.name,
          code: country.alpha3Code,
          currencyCode: country.currencies?.[0].code || "USD",
          currencySymbol: country.currencies?.[0].symbol || "$",
        })) as Record<string, any>[];

        // CHECK WHICH ONES ARE FOR UPDATE AND WHICH ONES ARE NEW
        const existingCountriesQuery = await model
          .find({
            code: { $in: formattedCountries.map((c: any) => c.code) },
          })
          .session(newSession)
          .lean();

        const countriesToUpdate = formattedCountries
          .filter((c) =>
            existingCountriesQuery.some((ec) => ec.code === c.code)
          )
          .map((c) => {
            const existing = existingCountriesQuery.find(
              (ec) => ec.code === c.code
            );

            return { ...c, _id: existing!._id };
          });

        const countriesToCreate = formattedCountries.filter(
          (c) => !existingCountriesQuery.some((ec) => ec.code === c.code)
        );

        // PERFORM BULK UPDATES AND CREATIONS
        const updatedCountries = await Promise.all(
          countriesToUpdate.map(
            async (c) =>
              await model.findByIdAndUpdate(c._id, c, {
                session: newSession,
              })
          )
        );

        // PERFORM BULK INSERTION
        const createdCountries = await model.insertMany(countriesToCreate, {
          session: newSession,
        });

        // RETURN THE NEWLY CREATED COUNTRIES
        return [...updatedCountries, ...createdCountries] as CountryDocument[];
      }
    );
  }
}
