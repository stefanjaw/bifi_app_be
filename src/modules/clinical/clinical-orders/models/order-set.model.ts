import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { OrderSetDocument } from "@mongodb-types";

/** Mongoose schema for clinical order set records */
const orderSetSchema = new Schema(
  {
    careContinuumId: {
      type: Schema.Types.ObjectId,
      ref: "CareContinuum",
      autopopulate: {
        maxDepth: 1,
      },
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      autopopulate: {
        maxDepth: 1,
      },
      required: true,
    },
    byName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      default: "Routine",
    },
    state: {
      type: String,
      required: true,
    },
    orders: [
      {
        orderId: {
          type: Schema.Types.ObjectId,
          ref: "Order",
          autopopulate: {
            maxDepth: 1,
          },
        },
      },
    ],
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
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

orderSetSchema.plugin(paginate);
orderSetSchema.plugin(autopopulate);

const orderSetModel = mongoose.model<
  OrderSetDocument,
  PaginateModel<OrderSetDocument>
>("OrderSet", orderSetSchema);

/** Mongoose model for clinical order sets */
export { orderSetModel };
