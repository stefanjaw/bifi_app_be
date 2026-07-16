import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProductLotDocument } from "@mongodb-types";

/** Mongoose schema for product lot records */
const productLotSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    code: { type: String, required: true },
    barCode: { type: String, default: "" },
    internationalCode: { type: String, default: "" },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "InventoryProduct",
        autopopulate: { select: "name", maxDepth: 1 },
      },
    ],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productLotSchema.plugin(paginate);
productLotSchema.plugin(autopopulate);

/** Mongoose model for product lot records */
const productLotModel = mongoose.model<
  ProductLotDocument,
  PaginateModel<ProductLotDocument>
>("ProductLot", productLotSchema);

export { productLotModel };
