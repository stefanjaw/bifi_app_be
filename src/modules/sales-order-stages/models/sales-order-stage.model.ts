import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const salesOrderStageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    order: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

salesOrderStageSchema.plugin(paginate);
salesOrderStageSchema.plugin(autopopulate);

import { SalesOrderStageDocument } from "@mongodb-types";

export { SalesOrderStageDocument };

const salesOrderStageModel = mongoose.model<
  SalesOrderStageDocument,
  PaginateModel<SalesOrderStageDocument>
>("SalesOrderStage", salesOrderStageSchema);

export { salesOrderStageModel };
