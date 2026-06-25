import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { fileSchema } from "../../../system";
import { TaskDocument } from "@mongodb-types";

const taskSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    plannedStartDate: {
      type: Date,
      required: false,
    },
    plannedEndDate: {
      type: Date,
      required: false,
    },
    // in seconds
    plannedDuration: {
      type: Number,
      required: false,
    },
    // porcentages from 0 to 100
    progress: {
      type: Number,
      default: 0,
    },
    typeId: {
      type: Schema.Types.ObjectId,
      ref: "TaskType",
      autopopulate: { select: "name color" },
      required: false,
    },
    stage: {
      type: Schema.Types.ObjectId,
      ref: "TaskStage",
      autopopulate: { select: "name color sequence" },
      required: false,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      autopopulate: {
        select: "name number stage priority sequence dateStart dateEnd active",
        maxDepth: 1,
      },
      required: false,
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      autopopulate: {
        select: "name priority stage assigned active",
        maxDepth: 1,
      },
      required: false,
    },
    dependencyIds: {
      type: [Schema.Types.ObjectId],
      ref: "Task",
      required: false,
      autopopulate: {
        select: "name sequence priority stage progress isMilestone",
        maxDepth: 1,
      },
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: false,
      autopopulate: {
        select: "name sequence priority stage progress isMilestone",
        maxDepth: 1,
      },
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
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
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
      required: false,
    },
    assigned: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
      required: false,
    },
    attachments: {
      type: [fileSchema],
      required: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isMilestone: {
      type: Boolean,
      default: false,
    },
    sequence: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// taskSchema.virtual("childIds", {
//   ref: "Task",
//   localField: "_id",
//   foreignField: "parentId",
//   autopopulate: {
//     maxDepth: 1,
//   },
//   match: { active: true },
// });

taskSchema.plugin(paginate);
taskSchema.plugin(autopopulate);

const taskModel = mongoose.model<TaskDocument, PaginateModel<TaskDocument>>(
  "Task",
  taskSchema
);

export { taskModel };
