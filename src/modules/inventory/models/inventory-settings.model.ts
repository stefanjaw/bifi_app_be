import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Type representing an inventory settings document (singleton) */
export type InventorySettingsDocument = mongoose.Document & {
  defaultWarehouseId?: mongoose.Types.ObjectId;
  defaultLocationId?: mongoose.Types.ObjectId;
};

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

const inventorySettingsModel = mongoose.model<
  InventorySettingsDocument,
  PaginateModel<InventorySettingsDocument>
>("InventorySettings", inventorySettingsSchema);

export { inventorySettingsModel };
