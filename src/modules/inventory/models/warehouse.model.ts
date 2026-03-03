import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const warehouseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
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

warehouseSchema.plugin(paginate);
warehouseSchema.plugin(autopopulate);

export type WarehouseDocument = mongoose.Document & {
  name: string;
  code: string;
  address: string;
  active: boolean;
};

const warehouseModel = mongoose.model<
  WarehouseDocument,
  PaginateModel<WarehouseDocument>
>("Warehouse", warehouseSchema);

export { warehouseModel };
