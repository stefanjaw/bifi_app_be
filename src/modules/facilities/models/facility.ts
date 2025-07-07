import mongoose, { PaginateModel, Types } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { contact } from "../../contacts/models/contact";
import { room } from "./room";

export interface facility {
  _id: Types.ObjectId;
  mainPlace: contact;
  rooms: room[];
  active: boolean;
}

const facilitySchema = new Schema({
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
  rooms: {
    type: [Schema.Types.ObjectId],
    ref: "Room",
    autopopulate: true,
    default: [],
  },
  active: {
    type: Boolean,
    default: true,
  },
});

facilitySchema.plugin(paginate);
facilitySchema.plugin(autopopulate);

const facilityModel = mongoose.model<facility, PaginateModel<facility>>(
  "Facility",
  facilitySchema
);

export { facilityModel };
