import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { VendorDocument } from "@mongodb-types";
import { fileSchema } from "../../../../system";

const vendorSchema = new Schema(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      autopopulate: { select: "-photo128 -photo256 -photo512", maxDepth: 1 },
    },
    positionRoles: [
      {
        type: String,
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    engagementAgreement: [
      {
        fileId: { type: fileSchema },
        description: { type: String },
      },
    ],
    vendorId: {
      type: String,
      required: true,
    },
    credentials: [
      {
        type: String,
      },
    ],
    licenseCertificationType: {
      type: String,
      enum: ["Prepared foods vendor"],
    },
    licenseNumber: {
      type: String,
    },
    licenseExpirationDate: {
      type: Date,
    },
    credentialDocuments: [
      {
        fileId: { type: fileSchema },
        description: { type: String },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { maxDepth: 1 },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { maxDepth: 1 },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

vendorSchema.plugin(paginate);
vendorSchema.plugin(autopopulate);

const vendorModel = mongoose.model<
  VendorDocument,
  PaginateModel<VendorDocument>
>("Vendor", vendorSchema);

export { vendorModel };
