import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Mongoose schema for care continuum problem records */
const problemSchema = new Schema(
  {
    careContinuumId: {
      type: Schema.Types.ObjectId,
      ref: "CareContinuum",
      required: true,
      autopopulate: { select: "state patientId", maxDepth: 1 },
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      autopopulate: { select: "dob contactId", maxDepth: 1 },
    },
    contentBody: { type: String, required: true },
    byName: { type: String, required: true },
    state: {
      type: String,
      enum: ["active", "resolved", "voided"],
      required: true,
    },
    comment: { type: String, default: "" },
    diagnosedDate: { type: Date },
    resolvedDate: { type: Date },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { select: "username email", maxDepth: 1 },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { select: "username email", maxDepth: 1 },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

problemSchema.plugin(paginate);
problemSchema.plugin(autopopulate);
/** Mongoose model for care continuum problem records */
const problemModel = mongoose.model<any, PaginateModel<any>>(
  "CareContinuumProblem",
  problemSchema,
);
export { problemModel };
