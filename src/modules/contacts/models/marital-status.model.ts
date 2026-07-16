import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

/** Mongoose schema for marital status records */
const maritalStatusSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

maritalStatusSchema.plugin(paginate);
maritalStatusSchema.plugin(autopopulate);

/** Mongoose paginate model for MaritalStatus */
const maritalStatusModel = mongoose.model<any, PaginateModel<any>>(
  "MaritalStatus",
  maritalStatusSchema,
);
export { maritalStatusModel };
