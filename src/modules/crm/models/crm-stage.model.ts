import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CrmStageDocument } from "@mongodb-types";

const crmStageSchema = new Schema(
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
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isWon: {
      type: Boolean,
      default: false,
    },
    isLost: {
      type: Boolean,
      default: false,
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
  { timestamps: true },
);

crmStageSchema.plugin(paginate);
crmStageSchema.plugin(autopopulate);

const crmStageModel = mongoose.model<
  CrmStageDocument,
  PaginateModel<CrmStageDocument>
>("CrmStage", crmStageSchema);

export { crmStageModel };
