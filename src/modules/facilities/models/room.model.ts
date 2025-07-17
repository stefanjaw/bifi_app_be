import mongoose, { PaginateModel } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { RoomDocument } from "@mongodb-types";

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

const roomModel = mongoose.model<RoomDocument, PaginateModel<RoomDocument>>(
  "Room",
  roomSchema
);

export { roomModel };
