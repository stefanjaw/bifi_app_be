import mongoose, { PaginateModel, Types } from "mongoose";
import { Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface room {
  _id: Types.ObjectId;
  name: string;
  code: string;
  address: string;
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
  active: {
    type: Boolean,
    default: true,
  },
});

roomSchema.plugin(paginate);
roomSchema.plugin(autopopulate);

const roomModel = mongoose.model<room, PaginateModel<room>>("Room", roomSchema);

export { roomModel };
