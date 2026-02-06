import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDTaxTypeDocument } from "@mongodb-types";

const bcdTaxTypeSchema = new Schema(
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

bcdTaxTypeSchema.plugin(paginate);
bcdTaxTypeSchema.plugin(autopopulate);

const bcdTaxTypeModel = mongoose.model<
  BCDTaxTypeDocument,
  PaginateModel<BCDTaxTypeDocument>
>("BCDTaxType", bcdTaxTypeSchema);
export { bcdTaxTypeModel };
