import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

const lineItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
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
      enum: ["draft", "sent", "partially_received", "received", "cancelled"],
      default: "draft",
    },
    issueDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    lineItems: [lineItemSchema],
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

export type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PurchaseOrderDocument = mongoose.Document & {
  poNumber: string;
  contactId: mongoose.Types.ObjectId;
  status: "draft" | "sent" | "partially_received" | "received" | "cancelled";
  issueDate: Date;
  expectedDeliveryDate?: Date;
  lineItems: LineItem[];
  totalAmount: number;
  notes?: string;
  stageId?: mongoose.Types.ObjectId | null;
};

const purchaseOrderModel = mongoose.model<PurchaseOrderDocument, PaginateModel<PurchaseOrderDocument>>(
  "PurchaseOrder",
  purchaseOrderSchema
);

export { purchaseOrderModel };
