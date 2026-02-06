import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDTypeDocument } from "@mongodb-types";

const bcdTypeSchema = new Schema(
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
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

bcdTypeSchema.plugin(paginate);
bcdTypeSchema.plugin(autopopulate);

const bcdTypeModel = mongoose.model<
  BCDTypeDocument,
  PaginateModel<BCDTypeDocument>
>("BCDType", bcdTypeSchema);
export { bcdTypeModel };
