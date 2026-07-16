import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Mongoose document interface for an admission goal record */
export interface AdmissionGoalDocument extends mongoose.Document {
  careContinuumId: mongoose.Types.ObjectId;
  state: string;
  tracking: string;
  patientId: mongoose.Types.ObjectId;
  interventions: mongoose.Types.ObjectId[];
  archived: boolean;
  contentTitle: string;
  contentBody: string;
  priority: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  active: boolean;
  summary: string;
}

/** Mongoose schema for admission goal records */
const admissionGoalSchema = new Schema(
  {
    careContinuumId: {
      type: Schema.Types.ObjectId,
      ref: "CareContinuum",
      autopopulate: { select: "state patientId", maxDepth: 1 },
    },
    state: { type: String, default: "" },
    tracking: { type: String, default: "" },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      autopopulate: { select: "dob contactId", maxDepth: 1 },
    },
    interventions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Intervention",
        autopopulate: { maxDepth: 1 },
      },
    ],
    archived: { type: Boolean, default: false },
    contentTitle: { type: String, required: true },
    contentBody: { type: String, required: true },
    priority: { type: Number, enum: [0, 1, 2, 3, 4], default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

admissionGoalSchema.virtual("summary").get(function (this: any) {
  return `${this.contentTitle}: ${this.contentBody.substring(0, 50)}...`;
});

admissionGoalSchema.plugin(paginate);
admissionGoalSchema.plugin(autopopulate);

/** Mongoose paginate model for admission goal operations */
export const admissionGoalModel = mongoose.model<
  AdmissionGoalDocument,
  PaginateModel<AdmissionGoalDocument>
>("AdmissionGoal", admissionGoalSchema);
