import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { OrderMaintenanceDocument } from "@mongodb-types";

/** Mongoose schema for clinical order maintenance records */
const orderMaintenanceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

orderMaintenanceSchema.plugin(paginate);
orderMaintenanceSchema.plugin(autopopulate);

const orderMaintenanceModel = mongoose.model<
  OrderMaintenanceDocument,
  PaginateModel<OrderMaintenanceDocument>
>("OrderMaintenance", orderMaintenanceSchema);

/** Mongoose model for clinical order maintenances */
export { orderMaintenanceModel };
