import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { fileSchema } from "../../../system";
import { TicketDocument } from "@mongodb-types";

const activityEntrySchema = new Schema(
  {
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { select: "username email contactId", maxDepth: 1 },
      required: false,
    },
  },
  { timestamps: true }
);

const notificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventType: {
      type: String,
      enum: ["ticket_created", "stage_changed", "priority_changed", "assigned_changed", "comment_added", "resolved", "closed", "reopened", "follower_added", "follower_removed"],
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ticketSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    internalNotes: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    type: {
      type: String,
      enum: ["task", "helpdesk"],
      default: "helpdesk",
    },
    stage: {
      type: Schema.Types.ObjectId,
      ref: "HelpdeskStage",
      autopopulate: true,
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
    senderUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
      required: false,
    },
    followers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: "",
    },
    appModule: {
      type: String,
      default: "",
    },
    attachments: {
      type: [fileSchema],
      required: false,
    },
    slaResponseDeadline: {
      type: Date,
      required: false,
    },
    slaResolutionDeadline: {
      type: Date,
      required: false,
    },
    resolvedAt: {
      type: Date,
      required: false,
    },
    closedAt: {
      type: Date,
      required: false,
    },
    taskIds: {
      type: [Schema.Types.ObjectId],
      ref: "Task",
      autopopulate: {
        select: "name priority stage assigned active",
        maxDepth: 1,
      },
      default: [],
    },
    activityHistory: {
      type: [activityEntrySchema],
      default: [],
    },
    notifications: {
      type: [notificationSchema],
      default: [],
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
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

ticketSchema.plugin(paginate);
ticketSchema.plugin(autopopulate);

const ticketModel = mongoose.model<TicketDocument, PaginateModel<TicketDocument>>(
  "Ticket",
  ticketSchema
);

export { ticketModel };
