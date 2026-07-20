import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { GenderDocument } from "@mongodb-types";

/** Mongoose schema for gender records */
const genderSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

genderSchema.plugin(paginate);
genderSchema.plugin(autopopulate);

/** Mongoose paginate model for Gender */
const genderModel = mongoose.model<
  GenderDocument,
  PaginateModel<GenderDocument>
>("Gender", genderSchema);
export { genderModel };
export { GenderDocument };
