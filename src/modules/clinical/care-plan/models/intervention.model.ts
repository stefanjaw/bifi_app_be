import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { InterventionDocument } from "@mongodb-types";

/** Mongoose schema for intervention records */
const interventionSchema = new Schema(
  {
    admissionGoalId: {
      type: Schema.Types.ObjectId,
      ref: "AdmissionGoal",
      required: true,
    },
    state: { type: String, default: "" },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    archived: { type: Boolean, default: false },
    contentTitle: { type: String, required: true },
    contentBody: { type: String, required: true },
    outcomes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Outcome",
        autopopulate: { maxDepth: 1 },
      },
    ],
    orderSetIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "OrderSet",
        autopopulate: { maxDepth: 1 },
      },
    ],
    orderIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
        autopopulate: { maxDepth: 1 },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

interventionSchema.plugin(paginate);
interventionSchema.plugin(autopopulate);

/** Mongoose paginate model for intervention operations */
export const interventionModel = mongoose.model<
  InterventionDocument,
  PaginateModel<InterventionDocument>
>("Intervention", interventionSchema);
