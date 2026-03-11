import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type PurchaseSettingsDocument = mongoose.Document & {
  purchaseSequence?: string;
  description?: string;
};

const purchaseSettingsSchema = new Schema(
  {
    purchaseSequence: {
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

purchaseSettingsSchema.plugin(paginate);
purchaseSettingsSchema.plugin(autopopulate);

const purchaseSettingsModel = mongoose.model<PurchaseSettingsDocument, PaginateModel<PurchaseSettingsDocument>>(
  "PurchaseSettings",
  purchaseSettingsSchema
);

export { purchaseSettingsModel };
