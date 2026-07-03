import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { TaskStageDocument } from "@mongodb-types";

const taskStageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#6366f1",
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

taskStageSchema.plugin(paginate);
taskStageSchema.plugin(autopopulate);

const taskStageModel = mongoose.model<
  TaskStageDocument,
  PaginateModel<TaskStageDocument>
>("TaskStage", taskStageSchema);

export { taskStageModel };
