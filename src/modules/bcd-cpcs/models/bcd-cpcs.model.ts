import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDCpcsDocument } from "@mongodb-types";

const bcdCpcsSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      length: 4,
    },
    description: {
      type: String,
      required: true,
    },
    bcdTypes: {
      type: [Schema.Types.ObjectId],
      ref: "BCDTypes",
      required: false,
      autopopulate: true,
    },
    tax: {
      type: [Schema.Types.ObjectId],
      ref: "BCDTax",
      required: false,
      autopopulate: true,
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

bcdCpcsSchema.plugin(paginate);
bcdCpcsSchema.plugin(autopopulate);

const bcdCpcsModel = mongoose.model<
  BCDCpcsDocument,
  PaginateModel<BCDCpcsDocument>
>("BCDCpcs", bcdCpcsSchema);
export { bcdCpcsModel };
