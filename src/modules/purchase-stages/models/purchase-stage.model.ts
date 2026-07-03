import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const purchaseStageSchema = new Schema(
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
    active: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

purchaseStageSchema.plugin(paginate);
purchaseStageSchema.plugin(autopopulate);

import { PurchaseStageDocument } from "@mongodb-types";

export { PurchaseStageDocument };

const purchaseStageModel = mongoose.model<
  PurchaseStageDocument,
  PaginateModel<PurchaseStageDocument>
>("PurchaseStage", purchaseStageSchema);

export { purchaseStageModel };
