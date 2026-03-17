import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { PricingEstimateDocument } from "@mongodb-types";

export { PricingEstimateDocument };

const lineItemSchema = new Schema(
  {
    product: { type: String, default: null },
    supplier: { type: String, default: null },
    partNo: { type: String, default: null },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    freightPerUnit: { type: Number, default: 0 },
    hsCode: { type: String, default: null },
    dutyPct: { type: Number, default: 0 },
    dutyPerUnit: { type: Number, default: 0 },
    wharfage: { type: Number, default: 0 },
    landedPerUnit: { type: Number, default: 0 },
    custPricePerUnit: { type: Number, default: 0 },
    marginPct: { type: Number, default: 0 },
    totalCust: { type: Number, default: 0 },
  },
  { _id: true }
);

const pricingControlsSchema = new Schema(
  {
    dutyFree: { type: Boolean, default: false },
    method: { type: String, default: "markup", enum: ["markup", "margin"] },
    markupFactor: { type: Number, default: 1.3 },
    margin: { type: Number, default: 30 },
  },
  { _id: false }
);

const pricingEstimateSchema = new Schema(
  {
    number: {
      type: String,
      required: false,
      default: null,
    },
    date: {
      type: Date,
      required: false,
      default: () => new Date(),
    },
    preparedBy: {
      type: String,
      required: false,
      default: null,
    },
    requestText: {
      type: String,
      required: false,
      default: "",
    },
    shippingMethod: {
      type: String,
      required: false,
      default: "sea",
    },
    pricingControls: {
      type: pricingControlsSchema,
      required: false,
      default: () => ({}),
    },
    specialInstructions: {
      type: String,
      required: false,
      default: "",
    },
    status: {
      type: String,
      required: false,
      default: "draft",
      enum: ["draft", "generated", "approved", "rejected"],
    },
    lineItems: {
      type: [lineItemSchema],
      required: false,
      default: [],
    },
    totalLanded: {
      type: Number,
      required: false,
      default: 0,
    },
    totalCustomer: {
      type: Number,
      required: false,
      default: 0,
    },
    wharfageBankFeePct: {
      type: Number,
      required: false,
      default: 0,
    },
    wharfageBankFeeAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    inputTokens: {
      type: Number,
      required: false,
      default: 0,
    },
    outputTokens: {
      type: Number,
      required: false,
      default: 0,
    },
    totalTokens: {
      type: Number,
      required: false,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      required: false,
      default: 0,
    },
    aiModel: {
      type: String,
      required: false,
      default: null,
    },
    active: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

pricingEstimateSchema.index({ number: 1 });
pricingEstimateSchema.index({ status: 1 });
pricingEstimateSchema.index({ active: 1 });
pricingEstimateSchema.index({ date: -1 });

pricingEstimateSchema.plugin(paginate);
pricingEstimateSchema.plugin(autopopulate);

const pricingEstimateModel = mongoose.model<
  PricingEstimateDocument,
  PaginateModel<PricingEstimateDocument>
>("PricingEstimate", pricingEstimateSchema);

export { pricingEstimateModel };
