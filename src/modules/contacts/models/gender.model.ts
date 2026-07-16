import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

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
const genderModel = mongoose.model<any, PaginateModel<any>>(
  "Gender",
  genderSchema,
);
export { genderModel };
