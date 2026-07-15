import { BaseService } from "../../../system";
import { currencyModel, CurrencyDocument } from "../models/currency.model";
import { ClientSession } from "mongoose";
import { runTransaction } from "../../../system";
import axios from "axios";

export class CurrencyService extends BaseService<CurrencyDocument> {
  constructor() {
    super({ model: currencyModel });
  }

  async populateCurrencies(session: ClientSession | undefined) {
    return await runTransaction<CurrencyDocument[]>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        // FETCH DATA FROM EXTERNAL API (frankfurter.dev v2)
        const response = await axios.get(
          "https://api.frankfurter.dev/v2/currencies",
        );

        const currenciesData: any[] = response.data;

        // EXTRACT UNIQUE CURRENCIES
        const formattedCurrencies = currenciesData.map((c) => {
          const upperCode = c.iso_code.toUpperCase();
          return {
            name: c.name || upperCode,
            code: upperCode,
            symbol: c.symbol || upperCode,
            decimalPrecision: 2,
            active: true,
          };
        });

        // CHECK WHICH ONES ARE FOR UPDATE AND WHICH ONES ARE NEW
        const existingCurrenciesQuery = await model
          .find({
            code: { $in: formattedCurrencies.map((c: any) => c.code) },
          })
          .session(newSession)
          .lean();

        const currenciesToUpdate = formattedCurrencies
          .filter((c) =>
            existingCurrenciesQuery.some((ec) => ec.code === c.code),
          )
          .map((c) => {
            const existing = existingCurrenciesQuery.find(
              (ec) => ec.code === c.code,
            );

            return { ...c, _id: existing!._id };
          });

        const currenciesToCreate = formattedCurrencies.filter(
          (c) => !existingCurrenciesQuery.some((ec) => ec.code === c.code),
        );

        // PERFORM BULK UPDATES AND CREATIONS
        const updatedCurrencies = await Promise.all(
          currenciesToUpdate.map(
            async (c) =>
              await model.findByIdAndUpdate(c._id, c, {
                session: newSession,
              }),
          ),
        );

        // PERFORM BULK INSERTION
        const createdCurrencies = await model.insertMany(currenciesToCreate, {
          session: newSession,
        });

        // RETURN THE NEWLY CREATED CURRENCIES
        return [...updatedCurrencies, ...createdCurrencies] as CurrencyDocument[];
      },
    );
  }
}
