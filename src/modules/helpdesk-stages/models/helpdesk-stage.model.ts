import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { HelpdeskStageDocument } from "@mongodb-types";

const helpdeskStageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
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

helpdeskStageSchema.plugin(paginate);
helpdeskStageSchema.plugin(autopopulate);

const helpdeskStageModel = mongoose.model<
  HelpdeskStageDocument,
  PaginateModel<HelpdeskStageDocument>
>("HelpdeskStage", helpdeskStageSchema);

export { helpdeskStageModel };
