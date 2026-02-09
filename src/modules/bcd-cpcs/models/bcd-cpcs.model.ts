import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDCpcDocument } from "@mongodb-types";

const bcdCpcSchema = new Schema(
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
      ref: "BCDType",
      required: false,
      autopopulate: true,
    },
    tax: {
      type: [
        {
          taxType: {
            type: Schema.Types.ObjectId,
            ref: "BCDTaxType",
            required: true,
            autopopulate: true,
          },
          taxId: {
            type: Schema.Types.ObjectId,
            ref: "BCDTaxId",
            required: true,
            autopopulate: true,
          },
        },
      ],
    },
    dutyRate: {
      type: {
        type: String,
        enum: ["SPECIFICATION", "MULTIPLIER"],
        required: true,
      },
      value: {
        type: Schema.Types.Mixed,
        required: true,
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
  },
);

bcdCpcSchema.plugin(paginate);
bcdCpcSchema.plugin(autopopulate);

const bcdCpcModel = mongoose.model<
  BCDCpcDocument,
  PaginateModel<BCDCpcDocument>
>("BCDCpc", bcdCpcSchema);
export { bcdCpcModel };
