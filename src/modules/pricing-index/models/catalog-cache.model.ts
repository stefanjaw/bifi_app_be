import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

export type CatalogCacheDocument = mongoose.Document & {
  product_name?: string;
  part_number?: string;
  supplier?: string;
  unit_price?: number;
  currency?: string;
  price_break_qty?: number;
  source_file?: string;
  file_date?: Date;
  last_indexed?: Date;
  folderId?: string;
  active?: boolean;
};

const catalogCacheSchema = new Schema(
  {
    product_name: { type: String, required: false, default: null },
    part_number: { type: String, required: false, default: null },
    supplier: { type: String, required: false, default: null },
    unit_price: { type: Number, required: false, default: null },
    currency: { type: String, required: false, default: "USD" },
    price_break_qty: { type: Number, required: false, default: null },
    source_file: { type: String, required: false, default: null },
    file_date: { type: Date, required: false, default: null },
    last_indexed: { type: Date, required: false, default: null },
    folderId: { type: String, required: false, default: null },
    active: { type: Boolean, required: false, default: true },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  },
);

catalogCacheSchema.index({
  product_name: "text",
  supplier: "text",
  part_number: "text",
});
catalogCacheSchema.index({ active: 1 });
catalogCacheSchema.index({ source_file: 1 });
catalogCacheSchema.plugin(paginate);

const catalogCacheModel = mongoose.model<
  CatalogCacheDocument,
  PaginateModel<CatalogCacheDocument>
>("CatalogCache", catalogCacheSchema);

export { catalogCacheModel };
