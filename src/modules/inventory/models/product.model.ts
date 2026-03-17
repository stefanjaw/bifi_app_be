import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      default: "",
    },
    unitOfMeasureId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryUom",
      required: false,
      autopopulate: {
        select: "name symbol categoryId",
        maxDepth: 1,
      },
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.plugin(paginate);
productSchema.plugin(autopopulate);

import { InventoryProductDocument as ProductDocument } from "@mongodb-types";

export { ProductDocument };

const productModel = mongoose.model<
  ProductDocument,
  PaginateModel<ProductDocument>
>("InventoryProduct", productSchema);

export { productModel };
