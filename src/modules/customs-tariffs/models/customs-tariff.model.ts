import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CustomsTariffDocument } from "@mongodb-types";

const customsTariffSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    chapter: {
      type: String,
      required: true,
    },
    heading: {
      type: String,
      required: true,
    },
    subheading: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    unitForDuty: {
      type: String,
      default: "value",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unitOfMeasurement: {
      type: String,
      default: "u",
    },
    rateOfDuty: {
      type: Number,
      default: 0,
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

customsTariffSchema.index({ chapter: 1, heading: 1, subheading: 1 });

customsTariffSchema.plugin(paginate);
customsTariffSchema.plugin(autopopulate);

const customsTariffModel = mongoose.model<
  CustomsTariffDocument,
  PaginateModel<CustomsTariffDocument>
>("CustomsTariff", customsTariffSchema, "customstariffs");

export { customsTariffModel };
