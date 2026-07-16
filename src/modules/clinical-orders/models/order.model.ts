import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { OrderDocument } from "@mongodb-types";
import { fileSchema } from "../../../system";

/** Mongoose schema for clinical order records */
const orderSchema = new Schema(
  {
    orderSetId: {
      type: Schema.Types.ObjectId,
      ref: "OrderSet",
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
    subType: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    interventionId: {
      type: Schema.Types.ObjectId,
      ref: "Intervention",
      autopopulate: {
        maxDepth: 1,
      },
      required: false,
    },
    priority: {
      type: String,
      default: "",
    },
    results: [
      {
        fileId: fileSchema,
        description: {
          type: String,
          default: "",
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

orderSchema.plugin(paginate);
orderSchema.plugin(autopopulate);

const orderModel = mongoose.model<OrderDocument, PaginateModel<OrderDocument>>(
  "Order",
  orderSchema,
);

/** Mongoose model for clinical orders */
export { orderModel };
