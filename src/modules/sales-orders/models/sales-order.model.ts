import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { SalesOrderDocument } from "@mongodb-types";

const lineItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const salesOrderSchema = new Schema(
  {
    crmId: {
      type: Schema.Types.ObjectId,
      ref: "CRM",
      required: true,
      autopopulate: {
        maxDepth: 1,
      },
    },
    contact: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      autopopulate: {
        select: "name lastName email",
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
    salesperson: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: {
        select: "username email contactId",
        maxDepth: 1,
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    closeDate: {
      type: Date,
      required: true,
    },
    lineItems: [lineItemSchema],
    notes: {
      type: String,
    },
    number: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

salesOrderSchema.plugin(autopopulate);
salesOrderSchema.plugin(paginate);

const salesOrderModel = mongoose.model<
  SalesOrderDocument,
  PaginateModel<SalesOrderDocument>
>("SalesOrder", salesOrderSchema);

export { salesOrderModel };
