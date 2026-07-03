import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { CustomsChapterDocument } from "@mongodb-types";

const customsChapterSchema = new Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
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
  },
);

customsChapterSchema.plugin(paginate);
customsChapterSchema.plugin(autopopulate);

const customsChapterModel = mongoose.model<
  CustomsChapterDocument,
  PaginateModel<CustomsChapterDocument>
>("CustomsChapter", customsChapterSchema, "customschapters");

export { customsChapterModel };
