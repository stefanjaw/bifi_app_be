import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const exchangeRateSchema = new Schema(
  {
    fromCurrencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
      autopopulate: {
        select: "name code symbol",
        maxDepth: 1,
      },
    },
    toCurrencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
      autopopulate: {
        select: "name code symbol",
        maxDepth: 1,
      },
    },
    rate: {
      type: Number,
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

exchangeRateSchema.plugin(paginate);
exchangeRateSchema.plugin(autopopulate);

import { ExchangeRateDocument } from "@mongodb-types";

export { ExchangeRateDocument };

const exchangeRateModel = mongoose.model<
  ExchangeRateDocument,
  PaginateModel<ExchangeRateDocument>
>("ExchangeRate", exchangeRateSchema);

export { exchangeRateModel };
