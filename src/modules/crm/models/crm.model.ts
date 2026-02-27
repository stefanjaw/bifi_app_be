import { CRMDocument } from "@mongodb-types";
import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const crmSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true },
    stage: {
      type: Schema.Types.ObjectId,
      ref: "CrmStage",
      autopopulate: {
        maxDepth: 1,
      },
    },
    probability: { type: Number, min: 0, max: 100, default: 10 },
    expectedCloseDate: Date,
    actualCloseDate: Date,
    contact: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      autopopulate: {
        select: "name lastName email phoneNumber type", // Fields to select from the child contacts
        maxDepth: 1,
      },
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      autopopulate: {
        maxDepth: 1,
      },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
    },
    description: String,
    notes: String,
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

crmSchema.plugin(autopopulate);
crmSchema.plugin(paginate);

const crmModel = mongoose.model<CRMDocument, PaginateModel<CRMDocument>>(
  "CRM",
  crmSchema
);

export { crmModel };
