import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type LanguageDocument = mongoose.Document & {
  locale: string;
  name: string;
  nativeName: string;
  active: boolean;
};

const languageSchema = new Schema(
  {
    locale: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    nativeName: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

languageSchema.index({ locale: 1 }, { unique: true });

languageSchema.plugin(paginate);
languageSchema.plugin(autopopulate);

const languageModel = mongoose.model<
  LanguageDocument,
  PaginateModel<LanguageDocument>
>("Language", languageSchema);

export { languageModel };
