import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { BCDAdditionalInformationTypeDocument } from "@mongodb-types";

const bcdAdditionalInformationTypeSchema = new Schema(
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

bcdAdditionalInformationTypeSchema.plugin(paginate);
bcdAdditionalInformationTypeSchema.plugin(autopopulate);

const bcdAdditionalInformationTypeModel = mongoose.model<
  BCDAdditionalInformationTypeDocument,
  PaginateModel<BCDAdditionalInformationTypeDocument>
>("BCDAdditionalInformationType", bcdAdditionalInformationTypeSchema);
export { bcdAdditionalInformationTypeModel };
