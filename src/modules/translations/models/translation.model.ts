import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type TranslationDocument = mongoose.Document & {
  locale: string;
  scope: string;
  key: string;
  value: string;
  active: boolean;
};

const translationSchema = new Schema(
  {
    locale: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
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

translationSchema.index({ locale: 1, scope: 1, key: 1 }, { unique: true });

translationSchema.plugin(paginate);
translationSchema.plugin(autopopulate);

const translationModel = mongoose.model<
  TranslationDocument,
  PaginateModel<TranslationDocument>
>("Translation", translationSchema);

export { translationModel };
