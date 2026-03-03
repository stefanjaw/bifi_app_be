import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export enum MovementType {
  IN = "IN",
  OUT = "OUT",
  ADJUSTMENT = "ADJUSTMENT",
  TRANSFER = "TRANSFER",
}

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
    type: {
      type: String,
      enum: Object.values(MovementType),
      required: true,
    },
    reference: {
      type: String,
      default: "",
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
  { timestamps: true }
);

stockMovementSchema.plugin(paginate);
stockMovementSchema.plugin(autopopulate);

export type StockMovementDocument = mongoose.Document & {
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  type: MovementType;
  reference: string;
  notes: string;
  date: Date;
};

const stockMovementModel = mongoose.model<
  StockMovementDocument,
  PaginateModel<StockMovementDocument>
>("StockMovement", stockMovementSchema);

export { stockMovementModel };
