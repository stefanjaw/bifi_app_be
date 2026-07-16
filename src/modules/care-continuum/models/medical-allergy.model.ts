import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Mongoose schema for medical allergy records */
const medicalAllergySchema = new Schema(
  {
    name: { type: String, required: true },
    acronym: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
medicalAllergySchema.plugin(paginate);
medicalAllergySchema.plugin(autopopulate);
/** Mongoose model for medical allergy records */
const medicalAllergyModel = mongoose.model<any, PaginateModel<any>>(
  "MedicalAllergy",
  medicalAllergySchema,
);
export { medicalAllergyModel };
