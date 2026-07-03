import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type PricingSettingsDocument = mongoose.Document & {
  estimateSequence?: mongoose.Types.ObjectId;
  defaultWharfageBankFeePct?: number;
  defaultShippingMethod?: string;
  defaultPricingMethod?: string;
  defaultMarkupFactor?: number;
  defaultMargin?: number;
  folders?: Array<{
    type: "pricing" | "freight" | "config";
    folderId: string;
    label?: string;
  }>;
  catalogLastIndexed?: Date;
  freightLastIndexed?: Date;
};

const pricingFolderSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["pricing", "freight", "config"],
    },
    folderId: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: false,
    },
  },
  { _id: true },
);

const pricingSettingsSchema = new Schema(
  {
    estimateSequence: {
      type: Schema.Types.ObjectId,
      ref: "Sequence",
      required: false,
      default: null,
      autopopulate: { maxDepth: 1 },
    },
    defaultWharfageBankFeePct: {
      type: Number,
      required: false,
      default: 2,
    },
    defaultShippingMethod: {
      type: String,
      required: false,
      default: "sea",
    },
    defaultPricingMethod: {
      type: String,
      required: false,
      default: "markup",
      enum: ["markup", "margin"],
    },
    defaultMarkupFactor: {
      type: Number,
      required: false,
      default: 1.3,
    },
    defaultMargin: {
      type: Number,
      required: false,
      default: 30,
    },
    folders: {
      type: [pricingFolderSchema],
      required: false,
      default: [],
    },
    catalogLastIndexed: {
      type: Date,
      required: false,
      default: null,
    },
    freightLastIndexed: {
      type: Date,
      required: false,
      default: null,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

pricingSettingsSchema.plugin(paginate);
pricingSettingsSchema.plugin(autopopulate);

const pricingSettingsModel = mongoose.model<
  PricingSettingsDocument,
  PaginateModel<PricingSettingsDocument>
>("PricingSettings", pricingSettingsSchema);

export { pricingSettingsModel };
