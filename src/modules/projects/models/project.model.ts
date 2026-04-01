import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { ProjectDocument } from "@mongodb-types";

const projectSchema = new Schema(
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
    stage: {
      type: Schema.Types.ObjectId,
      ref: "ProjectStage",
      autopopulate: {
        maxDepth: 1,
      },
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      autopopulate: {
        maxDepth: 2,
      },
    },
    dateStart: {
      type: Date,
      required: true,
    },
    dateEnd: {
      type: Date,
      required: true,
    },
    sequence: {
      type: Number,
      default: 10,
    },
    active: {
      type: Boolean,
      default: true,
    },
    number: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

projectSchema.plugin(paginate);
projectSchema.plugin(autopopulate);

const projectModel = mongoose.model<
  ProjectDocument,
  PaginateModel<ProjectDocument>
>("Project", projectSchema);

export { projectModel };
