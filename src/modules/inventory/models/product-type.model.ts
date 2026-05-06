import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const productTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productTypeSchema.plugin(paginate);
productTypeSchema.plugin(autopopulate);

import { InventoryProductTypeDocument as ProductTypeDocument } from "@mongodb-types";

export { ProductTypeDocument };

const productTypeModel = mongoose.model<
  ProductTypeDocument,
  PaginateModel<ProductTypeDocument>
>("InventoryProductType", productTypeSchema);

export { productTypeModel };
