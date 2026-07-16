import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Mongoose schema for admission type records */
const admissionTypeSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
admissionTypeSchema.plugin(paginate);
admissionTypeSchema.plugin(autopopulate);
/** Mongoose model for admission type records */
const admissionTypeModel = mongoose.model<any, PaginateModel<any>>(
  "CareContinuumAdmissionType",
  admissionTypeSchema,
);
export { admissionTypeModel };
