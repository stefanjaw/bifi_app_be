import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Enumeration of inventory valuation methods (FIFO reserved for future use) */
export enum ValuationMethod {
  WEIGHTED_AVERAGE = "WEIGHTED_AVERAGE",
  FIFO = "FIFO",
}

/** Mongoose schema for inventory settings (singleton) */
const inventorySettingsSchema = new Schema(
  {
    defaultWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: false,
      default: null,
      autopopulate: { select: "name code", maxDepth: 1 },
    },
    defaultLocationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: false,
      default: null,
      autopopulate: { select: "name code warehouseId", maxDepth: 1 },
    },
    /** Costing method used for inventory valuation */
    valuationMethod: {
      type: String,
      enum: Object.values(ValuationMethod),
      required: false,
      default: ValuationMethod.WEIGHTED_AVERAGE,
    },
  },
  {
    collection: "inventorysettings",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

inventorySettingsSchema.plugin(paginate);
inventorySettingsSchema.plugin(autopopulate);

import { InventorySettingsDocument } from "@mongodb-types";

export { InventorySettingsDocument };

const inventorySettingsModel = mongoose.model<
  InventorySettingsDocument,
  PaginateModel<InventorySettingsDocument>
>("InventorySettings", inventorySettingsSchema);

export { inventorySettingsModel };
