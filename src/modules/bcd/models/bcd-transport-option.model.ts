import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDTransportOptionDocument } from "@mongodb-types";
import { BCDTransportOptionTypeEnum } from "./bcd-transport-option.types";

const bcdTransportOptionSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: Object.values(BCDTransportOptionTypeEnum),
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

bcdTransportOptionSchema.plugin(paginate);
bcdTransportOptionSchema.plugin(autopopulate);

const bcdTransportOptionModel = mongoose.model<
  BCDTransportOptionDocument,
  PaginateModel<BCDTransportOptionDocument>
>("BCDTransportOption", bcdTransportOptionSchema);
export { bcdTransportOptionModel };
