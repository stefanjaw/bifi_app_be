import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CustomsHeadingDocument } from "@mongodb-types";

const customsHeadingSchema = new Schema(
  {
    heading: {
      type: String,
      required: true,
    },
    chapter: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
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

customsHeadingSchema.index({ heading: 1, chapter: 1 }, { unique: true });

customsHeadingSchema.plugin(paginate);
customsHeadingSchema.plugin(autopopulate);

const customsHeadingModel = mongoose.model<
  CustomsHeadingDocument,
  PaginateModel<CustomsHeadingDocument>
>("CustomsHeading", customsHeadingSchema, "customsheadings");

export { customsHeadingModel };
