import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Mongoose schema for stock balance records (product+location inventory) */
const stockBalanceSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      required: true,
      autopopulate: {
        select: "name sku unit unitOfMeasureId costPrice salePrice",
        maxDepth: 1,
      },
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
      autopopulate: {
        select: "name code warehouseId",
        maxDepth: 1,
      },
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      autopopulate: {
        select: "name code",
        maxDepth: 1,
      },
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

stockBalanceSchema.index({ productId: 1, locationId: 1 }, { unique: true });
stockBalanceSchema.plugin(paginate);
stockBalanceSchema.plugin(autopopulate);

import { StockBalanceDocument } from "@mongodb-types";

export { StockBalanceDocument };

const stockBalanceModel = mongoose.model<
  StockBalanceDocument,
  PaginateModel<StockBalanceDocument>
>("StockBalance", stockBalanceSchema);

export { stockBalanceModel };
