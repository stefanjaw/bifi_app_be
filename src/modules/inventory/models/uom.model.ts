import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const uomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      default: "",
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryUomCategory",
      required: true,
      autopopulate: {
        select: "name",
        maxDepth: 1,
      },
    },
    crUnidadMedida: {
      type: String,
      required: false,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

uomSchema.plugin(paginate);
uomSchema.plugin(autopopulate);

import { InventoryUomDocument as UomDocument } from "@mongodb-types";

export { UomDocument };

const uomModel = mongoose.model<UomDocument, PaginateModel<UomDocument>>(
  "InventoryUom",
  uomSchema
);

export { uomModel };
