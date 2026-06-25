import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

export type FreightCacheDocument = mongoose.Document & {
  rate_type?: string;
  carrier?: string;
  service?: string;
  zone?: string;
  weight_min_lb?: number;
  weight_max_lb?: number;
  rate_usd?: number;
  unit?: string;
  origin?: string;
  destination?: string;
  effective_date?: Date;
  hs_code?: string;
  duty_rate_pct?: number;
  product_description?: string;
  source_file?: string;
  folderId?: string;
  active?: boolean;
};

const freightCacheSchema = new Schema(
  {
    rate_type: { type: String, required: false, default: null },
    carrier: { type: String, required: false, default: null },
    service: { type: String, required: false, default: null },
    zone: { type: String, required: false, default: null },
    weight_min_lb: { type: Number, required: false, default: null },
    weight_max_lb: { type: Number, required: false, default: null },
    rate_usd: { type: Number, required: false, default: null },
    unit: { type: String, required: false, default: null },
    origin: { type: String, required: false, default: null },
    destination: { type: String, required: false, default: null },
    effective_date: { type: Date, required: false, default: null },
    hs_code: { type: String, required: false, default: null },
    duty_rate_pct: { type: Number, required: false, default: null },
    product_description: { type: String, required: false, default: null },
    source_file: { type: String, required: false, default: null },
    folderId: { type: String, required: false, default: null },
    active: { type: Boolean, required: false, default: true },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

freightCacheSchema.index({
  carrier: "text",
  zone: "text",
  origin: "text",
  destination: "text",
  product_description: "text",
  hs_code: "text",
});
freightCacheSchema.index({ active: 1 });
freightCacheSchema.index({ source_file: 1 });
freightCacheSchema.plugin(paginate);

const freightCacheModel = mongoose.model<
  FreightCacheDocument,
  PaginateModel<FreightCacheDocument>
>("FreightCache", freightCacheSchema);

export { freightCacheModel };
