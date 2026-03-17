import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const uomCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

uomCategorySchema.plugin(paginate);
uomCategorySchema.plugin(autopopulate);

import { InventoryUomCategoryDocument as UomCategoryDocument } from "@mongodb-types";

export { UomCategoryDocument };

const uomCategoryModel = mongoose.model<
  UomCategoryDocument,
  PaginateModel<UomCategoryDocument>
>("InventoryUomCategory", uomCategorySchema);

export { uomCategoryModel };
