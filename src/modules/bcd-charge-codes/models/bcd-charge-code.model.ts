import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDChargeCodeDocument } from "@mongodb-types";
import {
  BCDChargeCodeLevelEnum,
  BCDChargeCodeTypeEnum,
} from "./bcd-charge-code-enums";

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
    levels: {
      type: [
        {
          type: String,
          enum: Object.values(BCDChargeCodeLevelEnum),
        },
      ],
      required: true,
    },
    impact: {
      type: {
        customsValue: {
          type: Boolean,
          required: true,
        },
        payable: {
          type: Boolean,
          required: true,
        },
      },
    },
    active: {
      type: Boolean,
      default: true,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

bcdChargeCodeSchema.pre("validate", function (next) {
  const doc = this;

  if (
    doc.levels.some((l) => l === BCDChargeCodeLevelEnum.HEADER) &&
    doc.impact?.customsValue === true
  ) {
    return next(new Error("Header level charges cannot affect customs value"));
  }

  next();
});

bcdChargeCodeSchema.plugin(paginate);
bcdChargeCodeSchema.plugin(autopopulate);

const bcdChargeCodeModel = mongoose.model<
  BCDChargeCodeDocument,
  PaginateModel<BCDChargeCodeDocument>
>("BCDChargeCode", bcdChargeCodeSchema);
export { bcdChargeCodeModel };
