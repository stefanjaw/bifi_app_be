import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { MedicalPrecautionDocument } from "@mongodb-types";

/** Mongoose schema for medical precaution records */
const medicalPrecautionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
medicalPrecautionSchema.plugin(paginate);
medicalPrecautionSchema.plugin(autopopulate);
/** Mongoose model for medical precaution records */
const medicalPrecautionModel = mongoose.model<
  MedicalPrecautionDocument,
  PaginateModel<MedicalPrecautionDocument>
>("MedicalPrecaution", medicalPrecautionSchema);
export { medicalPrecautionModel };
export { MedicalPrecautionDocument };
