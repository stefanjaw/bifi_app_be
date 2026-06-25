import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import { TicketRuleDocument } from "@mongodb-types";

const ticketRuleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    field: {
      type: String,
      enum: ["name", "description", "category", "appModule", "type", "tags"],
      required: true,
    },
    operator: {
      type: String,
      enum: ["contains", "equals", "startsWith", "endsWith"],
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ["setAssigned", "setPriority"],
      required: true,
    },
    actionValue: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ticketRuleSchema.plugin(paginate);

export const ticketRuleModel = mongoose.model<
  TicketRuleDocument,
  PaginateModel<TicketRuleDocument>
>("TicketRule", ticketRuleSchema);
