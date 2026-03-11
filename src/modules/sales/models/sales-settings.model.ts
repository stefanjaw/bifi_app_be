import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type SalesSettingsDocument = mongoose.Document & {
  orderSequence?: string;
  description?: string;
};

const salesSettingsSchema = new Schema(
  {
    orderSequence: {
      type: Schema.Types.ObjectId,
      ref: "Sequence",
      required: false,
      default: null,
      autopopulate: { maxDepth: 1 },
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

salesSettingsSchema.plugin(paginate);
salesSettingsSchema.plugin(autopopulate);

const salesSettingsModel = mongoose.model<SalesSettingsDocument, PaginateModel<SalesSettingsDocument>>(
  "SalesSettings",
  salesSettingsSchema
);

export { salesSettingsModel };
