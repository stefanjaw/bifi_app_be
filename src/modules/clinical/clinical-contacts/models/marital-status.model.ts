import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { MaritalStatusDocument } from "@mongodb-types";

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
const maritalStatusModel = mongoose.model<
  MaritalStatusDocument,
  PaginateModel<MaritalStatusDocument>
>("MaritalStatus", maritalStatusSchema);
export { maritalStatusModel };
export { MaritalStatusDocument };
