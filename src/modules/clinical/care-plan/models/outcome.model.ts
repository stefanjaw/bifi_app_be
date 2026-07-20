import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { OutcomeDocument } from "@mongodb-types";

/** Mongoose schema for outcome records */
const outcomeSchema = new Schema(
  {
    interventionId: {
      type: Schema.Types.ObjectId,
      ref: "Intervention",
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    archived: { type: Boolean, default: false },
    contentTitle: { type: String, required: true },
    contentBody: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

outcomeSchema.plugin(paginate);
outcomeSchema.plugin(autopopulate);

/** Mongoose paginate model for outcome operations */
export const outcomeModel = mongoose.model<
  OutcomeDocument,
  PaginateModel<OutcomeDocument>
>("Outcome", outcomeSchema);
