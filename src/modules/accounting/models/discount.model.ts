import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

export interface DiscountDocument extends mongoose.Document {
  name: string;
  discountType: DiscountType;
  value: number;
  active: boolean;
  crNaturalezaDescuento?: string;
}

const discountSchema = new Schema(
  {
    name: { type: String, required: true },
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    crNaturalezaDescuento: { type: String, required: false },
  },
  { timestamps: true },
);

discountSchema.plugin(paginate);
discountSchema.plugin(autopopulate);

export const discountModel = mongoose.model<
  DiscountDocument,
  PaginateModel<DiscountDocument>
>("Discount", discountSchema);
