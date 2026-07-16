import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { VitalSignTypeDocument } from "@mongodb-types";

/** Mongoose schema for vital sign type definitions */
const vitalSignTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    ranges: [
      {
        name: { type: String },
        color: { type: String },
        min: { type: Number },
        max: { type: Number },
      },
    ],
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

vitalSignTypeSchema.plugin(paginate);
vitalSignTypeSchema.plugin(autopopulate);

/** Mongoose paginate model for VitalSignType documents */
const vitalSignTypeModel = mongoose.model<
  VitalSignTypeDocument,
  PaginateModel<VitalSignTypeDocument>
>("VitalSignType", vitalSignTypeSchema);

export { vitalSignTypeModel };
