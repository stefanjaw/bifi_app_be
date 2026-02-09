import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDChargeCodeDocument } from "@mongodb-types";
import { BCDChargeCodeTypeEnum } from "./bcd-charge-code-enums";

const bcdChargeCodeSchema = new Schema(
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
    type: {
      type: String,
      enum: Object.values(BCDChargeCodeTypeEnum),
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

bcdChargeCodeSchema.plugin(paginate);
bcdChargeCodeSchema.plugin(autopopulate);

const bcdChargeCodeModel = mongoose.model<
  BCDChargeCodeDocument,
  PaginateModel<BCDChargeCodeDocument>
>("BCDChargeCode", bcdChargeCodeSchema);
export { bcdChargeCodeModel };
