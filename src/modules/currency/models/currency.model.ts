import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const currencySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    decimalPrecision: {
      type: Number,
      default: 2,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

currencySchema.plugin(paginate);
currencySchema.plugin(autopopulate);

import { CurrencyDocument } from "@mongodb-types";

export { CurrencyDocument };

const currencyModel = mongoose.model<
  CurrencyDocument,
  PaginateModel<CurrencyDocument>
>("Currency", currencySchema);

export { currencyModel };
