import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CareContinuumRaceDocument } from "@mongodb-types";

/** Mongoose schema for race records */
const raceSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
raceSchema.plugin(paginate);
raceSchema.plugin(autopopulate);
/** Mongoose model for race records */
const raceModel = mongoose.model<
  CareContinuumRaceDocument,
  PaginateModel<CareContinuumRaceDocument>
>("CareContinuumRace", raceSchema);
export { raceModel };
export { CareContinuumRaceDocument };
