import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProductFrequencyDocument } from "@mongodb-types";

/** Mongoose schema for product frequency records */
const productFrequencySchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productFrequencySchema.plugin(paginate);
productFrequencySchema.plugin(autopopulate);

/** Mongoose model for product frequency records */
const productFrequencyModel = mongoose.model<
  ProductFrequencyDocument,
  PaginateModel<ProductFrequencyDocument>
>("ProductFrequency", productFrequencySchema);

export { productFrequencyModel };
