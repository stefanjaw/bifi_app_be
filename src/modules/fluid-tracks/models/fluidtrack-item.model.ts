import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { FluidTrackItemDocument } from "@mongodb-types";

/** Mongoose schema for fluid track item records */
const fluidTrackItemSchema = new Schema(
  {
    tracks: [
      {
        name: { type: String },
        value: { type: Number },
        description: { type: String },
        dateFluidTrack: { type: Date },
        active: { type: Boolean, default: true },
        patientProgressNoteId: {
          type: Schema.Types.ObjectId,
          ref: "ProgressNote",
          autopopulate: { maxDepth: 1 },
        },
      },
    ],
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

fluidTrackItemSchema.plugin(paginate);
fluidTrackItemSchema.plugin(autopopulate);

/** Mongoose paginate model for FluidTrackItem documents */
const fluidTrackItemModel = mongoose.model<
  FluidTrackItemDocument,
  PaginateModel<FluidTrackItemDocument>
>("FluidTrackItem", fluidTrackItemSchema);

export { fluidTrackItemModel };
