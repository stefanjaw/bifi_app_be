import { ShippingDocument } from "@mongodb-types";
import mongoose, { PaginateModel, Schema } from "mongoose";
import autopopulate from "mongoose-autopopulate";
import paginate from "mongoose-paginate-v2";
import { invoiceSchema } from "./invoice.model";

export enum ShippingStatus {
  UPLOADING = "UPLOADING",
  ERROR = "ERROR",
  COMPLETE = "PDF_PROCESSED",
  BCD_SENT = "BCD_SENT",
}

export enum ShippingStage {
  HS_CODES = "HS_CODES",
  TARIFF_CODES = "TARIFF_CODES",
  GROUPING = "GROUPING", // BCD
  SUMMARY = "SUMMARY",
  COMPLETE = "COMPLETE",
}

const shippingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    origin: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      autopopulate: true,
      required: true,
    },
    destination: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      autopopulate: true,
      required: true,
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
    status: {
      type: String,
      enum: Object.values(ShippingStatus),
      required: true,
    },
    stage: {
      type: String,
      enum: Object.values(ShippingStage),
      required: true,
    },
    invoices: [
      {
        type: invoiceSchema,
        required: true,
      },
    ],
    // bcds: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "bcd",
    //     required: false,
    //   },
    // ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true }, // Include virtuals in toObject output
    toJSON: { virtuals: true }, // Include virtuals in toJSON output
  },
);

shippingSchema.virtual("bcds", {
  ref: "BCD",
  localField: "_id",
  foreignField: "shippingId",
  autopopulate: {
    maxDepth: 1,
  },
});

shippingSchema.plugin(paginate);
shippingSchema.plugin(autopopulate);

const shippingModel = mongoose.model<
  ShippingDocument,
  PaginateModel<ShippingDocument>
>("Shipping", shippingSchema);

export { shippingModel };
