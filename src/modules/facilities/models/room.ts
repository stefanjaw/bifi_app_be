import mongoose, { PaginateModel, Types } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { facility } from "./facility";

export interface room {
  _id: Types.ObjectId;
  name: string;
  code: string;
  address: string;
  facilityId: facility;
  active: boolean;
}

const roomSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  facilityId: {
    type: Schema.Types.ObjectId,
    ref: "Facility",
    required: true,
    autopopulate: {
      select: "mainPlace name active", // Fields to select from the facility
      maxDepth: 1, // Limit depth to one level
    },
  },
  active: {
    type: Boolean,
    default: true,
  },
});

roomSchema.plugin(paginate);
roomSchema.plugin(autopopulate);

const roomModel = mongoose.model<room, PaginateModel<room>>("Room", roomSchema);

export { roomModel };
