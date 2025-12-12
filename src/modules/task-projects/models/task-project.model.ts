import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { TaskProjectDocument } from "@mongodb-types";

const taskProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

taskProjectSchema.plugin(paginate);
taskProjectSchema.plugin(autopopulate);

const taskProjectModel = mongoose.model<
  TaskProjectDocument,
  PaginateModel<TaskProjectDocument>
>("TaskProject", taskProjectSchema);

export { taskProjectModel };
