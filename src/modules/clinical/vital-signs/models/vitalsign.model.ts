import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { VitalSignDocument } from "@mongodb-types";

/** Mongoose schema for vital sign records */
const vitalSignSchema = new Schema(
  {
    dateVital: {
      type: Date,
    },
    measuredVitals: [
      {
        value: { type: String },
        method: { type: String },
        vitalSignTypeId: {
          type: Schema.Types.ObjectId,
          ref: "VitalSignType",
          autopopulate: { maxDepth: 1 },
        },
      },
    ],
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      autopopulate: { maxDepth: 1 },
    },
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

vitalSignSchema.plugin(paginate);
vitalSignSchema.plugin(autopopulate);

/** Mongoose paginate model for VitalSign documents */
const vitalSignModel = mongoose.model<
  VitalSignDocument,
  PaginateModel<VitalSignDocument>
>("VitalSign", vitalSignSchema);

export { vitalSignModel };
