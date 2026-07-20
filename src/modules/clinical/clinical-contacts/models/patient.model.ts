import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { PatientDocument } from "@mongodb-types";

/** Mongoose schema for patient records */
const patientSchema = new Schema(
  {
    dob: { type: Date, required: true },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      autopopulate: { select: "-photo128 -photo256 -photo512", maxDepth: 1 },
    },
    maritalStatus: {
      type: Schema.Types.ObjectId,
      ref: "MaritalStatus",
      required: false,
      autopopulate: { select: "name value", maxDepth: 1 },
    },
    language: { type: String, default: "Not Specified" },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

patientSchema.virtual("activeCareContinuum", {
  ref: "CareContinuum",
  localField: "_id",
  foreignField: "patientId",
  justOne: true,
  match: { state: "Active" },
});

patientSchema.virtual("age").get(function (this: any) {
  if (!this.dob) return null;
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
});

patientSchema.plugin(paginate);
patientSchema.plugin(autopopulate);

/** Mongoose paginate model for Patient */
const patientModel = mongoose.model<
  PatientDocument,
  PaginateModel<PatientDocument>
>("Patient", patientSchema);
export { patientModel };
export { PatientDocument };
