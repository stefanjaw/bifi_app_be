import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { TaskTypeDocument } from "@mongodb-types";

const taskTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
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

taskTypeSchema.plugin(paginate);
taskTypeSchema.plugin(autopopulate);

const taskTypeModel = mongoose.model<
  TaskTypeDocument,
  PaginateModel<TaskTypeDocument>
>("TaskType", taskTypeSchema);

export { taskTypeModel };
