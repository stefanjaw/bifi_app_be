import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { FacilityDocument } from "../../../types/mongoose.gen";

const facilitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mainPlace: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      // depth must be of one level
      autopopulate: {
        select: "name lastName email", // Fields to select from the parent contact
        maxDepth: 1, // Limit depth to one level
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true }, // Include virtuals in toObject output
    toJSON: { virtuals: true }, // Include virtuals in toJSON output
  }
);

// add virtual field for rooms
facilitySchema.virtual("rooms", {
  ref: "Room",
  localField: "_id",
  foreignField: "facilityId",
  autopopulate: {
    select: "name code address active", // Fields to select from the rooms
    maxDepth: 1, // Limit depth to one level
  },
  // only active ones
  match: { active: true },
});

facilitySchema.plugin(paginate);
facilitySchema.plugin(autopopulate);

const facilityModel = mongoose.model<
  FacilityDocument,
  PaginateModel<FacilityDocument>
>("Facility", facilitySchema);

export { facilityModel };
