import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export interface PaymentTermDocument extends mongoose.Document {
  name: string;
  active: boolean;
  lines: { percentage: number; dueDays: number }[];
}

const paymentTermLineSchema = new Schema(
  {
    percentage: { type: Number, required: true, min: 0 },
    dueDays: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentTermSchema = new Schema(
  {
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
    lines: { type: [paymentTermLineSchema], default: [] },
  },
  { timestamps: true }
);

paymentTermSchema.plugin(paginate);
paymentTermSchema.plugin(autopopulate);

export const paymentTermModel = mongoose.model<
  PaymentTermDocument,
  PaginateModel<PaymentTermDocument>
>("PaymentTerm", paymentTermSchema);
