import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Enumeration of stock movement types: IN, OUT, ADJUSTMENT, TRANSFER */
export enum MovementType {
  IN = "IN",
  OUT = "OUT",
  ADJUSTMENT = "ADJUSTMENT",
  TRANSFER = "TRANSFER",
}

/** Enumeration of stock adjustment directions: INCREASE adds stock, DECREASE removes stock */
export enum AdjustmentDirection {
  INCREASE = "INCREASE",
  DECREASE = "DECREASE",
}

/** Mongoose schema for stock movement records */
const stockMovementSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      required: true,
      autopopulate: {
        select: "name sku unit",
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
    locationId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryLocation",
      required: true,
      autopopulate: {
        select: "name code",
        maxDepth: 1,
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    /** Unit cost at the time of the transaction (defaults to the product's cost price for IN movements) */
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Total cost of the movement (unitCost × quantity), always computed server-side */
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    type: {
      type: String,
      enum: Object.values(MovementType),
      required: true,
    },
    /** Direction for ADJUSTMENT movements (INCREASE adds stock, DECREASE removes stock) */
    adjustmentDirection: {
      type: String,
      enum: Object.values(AdjustmentDirection),
      required: false,
      default: null,
    },
    reference: {
      type: String,
      default: "",
    },
    /** Classification of the external reference (e.g. purchase-order, sales-order); reserved for future integrations */
    referenceType: {
      type: String,
      default: "",
    },
    /** Original movement reversed by this movement (reversal audit trail) */
    reversalOf: {
      type: Schema.Types.ObjectId,
      ref: "StockMovement",
      required: false,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

stockMovementSchema.plugin(paginate);
stockMovementSchema.plugin(autopopulate);

import { StockMovementDocument } from "@mongodb-types";

export { StockMovementDocument };

const stockMovementModel = mongoose.model<
  StockMovementDocument,
  PaginateModel<StockMovementDocument>
>("StockMovement", stockMovementSchema);

export { stockMovementModel };
