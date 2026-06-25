import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDTaxIdDocument } from "@mongodb-types";

const bcdTaxIdSchema = new Schema(
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
  }
);

bcdTaxIdSchema.plugin(paginate);
bcdTaxIdSchema.plugin(autopopulate);

const bcdTaxIdModel = mongoose.model<
  BCDTaxIdDocument,
  PaginateModel<BCDTaxIdDocument>
>("BCDTaxId", bcdTaxIdSchema);
export { bcdTaxIdModel };
