import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const lineItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      required: false,
      autopopulate: {
        select: "name sku description costPrice unit unitOfMeasureId",
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
  { _id: false }
);

const appliedTaxSchema = new Schema(
  {
    taxId: { type: Schema.Types.ObjectId, ref: "Tax", required: true },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema(
  {
    poNumber: { type: String, required: true, unique: true, trim: true },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      autopopulate: { maxDepth: 1 },
    },
    status: {
      type: String,
      enum: ["draft", "confirmed", "sent", "partially_received", "received", "cancelled"],
      default: "draft",
    },
    issueDate: { type: Date },
    expectedDeliveryDate: { type: Date },
    lineItems: [lineItemSchema],
    subtotal: { type: Number, default: 0 },
    taxes: { type: [appliedTaxSchema], default: [] },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    notes: { type: String },
    stageId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseStage",
      default: null,
      autopopulate: { maxDepth: 1 },
    },
  },
  { timestamps: true }
);

purchaseOrderSchema.plugin(autopopulate);
purchaseOrderSchema.plugin(paginate);

import { PurchaseOrderDocument } from "@mongodb-types";

export { PurchaseOrderDocument };

const purchaseOrderModel = mongoose.model<PurchaseOrderDocument, PaginateModel<PurchaseOrderDocument>>(
  "PurchaseOrder",
  purchaseOrderSchema
);

export { purchaseOrderModel };
