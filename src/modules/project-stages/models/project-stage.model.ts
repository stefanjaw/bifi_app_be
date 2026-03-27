import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProjectStageDocument } from "@mongodb-types";

const projectStageSchema = new Schema(
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

projectStageSchema.plugin(paginate);
projectStageSchema.plugin(autopopulate);

const projectStageModel = mongoose.model<
  ProjectStageDocument,
  PaginateModel<ProjectStageDocument>
>("ProjectStage", projectStageSchema);

export { projectStageModel };
