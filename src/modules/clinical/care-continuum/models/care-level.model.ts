import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CareContinuumLevelDocument } from "@mongodb-types";

/** Mongoose schema for care continuum level records */
const careContinuumLevelSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
careContinuumLevelSchema.plugin(paginate);
careContinuumLevelSchema.plugin(autopopulate);
/** Mongoose model for care continuum level records */
const careContinuumLevelModel = mongoose.model<
  CareContinuumLevelDocument,
  PaginateModel<CareContinuumLevelDocument>
>("CareContinuumLevel", careContinuumLevelSchema);
export { careContinuumLevelModel };
export { CareContinuumLevelDocument };
