import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProductRouteDocument } from "@mongodb-types";

/** Mongoose schema for product route records */
const productRouteSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productRouteSchema.plugin(paginate);
productRouteSchema.plugin(autopopulate);

/** Mongoose model for product route records */
const productRouteModel = mongoose.model<
  ProductRouteDocument,
  PaginateModel<ProductRouteDocument>
>("ProductRoute", productRouteSchema);

export { productRouteModel };
