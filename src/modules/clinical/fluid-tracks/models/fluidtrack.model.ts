import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { FluidTrackDocument } from "@mongodb-types";

/** Mongoose schema for fluid track records */
const fluidTrackSchema = new Schema(
  {
    dayFluidTrack: {
      type: Date,
      required: true,
    },
    fluidTracks: [
      {
        type: Schema.Types.ObjectId,
        ref: "FluidTrackItem",
        autopopulate: { maxDepth: 1 },
      },
    ],
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      autopopulate: { maxDepth: 1 },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { maxDepth: 1 },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      autopopulate: { maxDepth: 1 },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

fluidTrackSchema.plugin(paginate);
fluidTrackSchema.plugin(autopopulate);

/** Mongoose paginate model for FluidTrack documents */
const fluidTrackModel = mongoose.model<
  FluidTrackDocument,
  PaginateModel<FluidTrackDocument>
>("FluidTrack", fluidTrackSchema);

export { fluidTrackModel };
