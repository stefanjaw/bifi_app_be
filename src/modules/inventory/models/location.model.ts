import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const locationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      autopopulate: {
        select: "name code address active",
        maxDepth: 1,
      },
    },
    capacity: {
      type: Number,
      min: 0,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

locationSchema.plugin(paginate);
locationSchema.plugin(autopopulate);

import { InventoryLocationDocument as LocationDocument } from "@mongodb-types";

export { LocationDocument };

const locationModel = mongoose.model<
  LocationDocument,
  PaginateModel<LocationDocument>
>("InventoryLocation", locationSchema);

export { locationModel };
