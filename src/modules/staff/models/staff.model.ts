import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { StaffDocument } from "@mongodb-types";
import { fileSchema } from "../../../system";

/** Mongoose schema for staff records */
const staffSchema = new Schema(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      autopopulate: { select: "-photo128 -photo256 -photo512", maxDepth: 1 },
    },
    engagementType: {
      type: String,
      enum: ["Employee", "Contractor"],
      required: true,
    },
    position: {
      type: String,
      enum: ["Nurse", "Caregiver", "Manager", "Other"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    workPermitRequired: {
      type: Boolean,
    },
    workPermitDocuments: [
      {
        fileId: { type: fileSchema },
        description: { type: String },
      },
    ],
    engagementAgreement: [
      {
        fileId: { type: fileSchema },
        description: { type: String },
      },
    ],
    personnelId: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    licenseCertificationType: {
      type: String,
      enum: ["Registered Nurse", "MD", "LPN", "Other"],
    },
    licenseNumber: {
      type: String,
    },
    licenseExpirationDate: {
      type: Date,
    },
    credentials: [
      {
        type: String,
      },
    ],
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

staffSchema.virtual("groups", {
  ref: "Group",
  localField: "_id",
  foreignField: "staff_ids.staff_id",
  autopopulate: { maxDepth: 1 },
});

staffSchema.plugin(paginate);
staffSchema.plugin(autopopulate);

/** Mongoose paginate model for Staff documents */
const staffModel = mongoose.model<StaffDocument, PaginateModel<StaffDocument>>(
  "Staff",
  staffSchema,
);

export { staffModel };
