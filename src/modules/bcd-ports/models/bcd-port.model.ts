import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDPortDocument } from "@mongodb-types";

const bcdPortSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      length: 3,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    wharfageRate: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

bcdPortSchema.plugin(paginate);
bcdPortSchema.plugin(autopopulate);

const bcdPortModel = mongoose.model<
  BCDPortDocument,
  PaginateModel<BCDPortDocument>
>("BCDPort", bcdPortSchema);
export { bcdPortModel };
