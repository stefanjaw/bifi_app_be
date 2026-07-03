import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { SalesOrderDocument } from "@mongodb-types";

const lineItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      required: false,
      autopopulate: {
        select: "name sku description salePrice unit unitOfMeasureId",
        maxDepth: 1,
      },
    },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    taxIds: [{ type: Schema.Types.ObjectId, ref: "Tax" }],
    discountId: {
      type: Schema.Types.ObjectId,
      ref: "Discount",
      required: false,
      default: null,
      autopopulate: { select: "name discountType value", maxDepth: 1 },
    },
  },
  { _id: false },
);

const salesOrderSchema = new Schema(
  {
    crmId: {
      type: Schema.Types.ObjectId,
      ref: "CRM",
      required: false,
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
    stageId: {
      type: Schema.Types.ObjectId,
      ref: "SalesOrderStage",
      required: false,
      autopopulate: {
        select: "name color order isDefault",
        maxDepth: 1,
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
      autopopulate: {
        select: "code symbol name decimalPrecision",
        maxDepth: 1,
      },
    },
    closeDate: {
      type: Date,
      required: true,
    },
    lineItems: [lineItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxes: [
      {
        taxId: {
          type: Schema.Types.ObjectId,
          ref: "Tax",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        _id: false,
      },
    ],
    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "quote",
        "confirmed",
        "shipped",
        "completed",
        "cancelled",
      ],
      default: "draft",
    },
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
  { timestamps: true },
);

salesOrderSchema.plugin(autopopulate);
salesOrderSchema.plugin(paginate);

const salesOrderModel = mongoose.model<
  SalesOrderDocument,
  PaginateModel<SalesOrderDocument>
>("SalesOrder", salesOrderSchema);

export { salesOrderModel };
