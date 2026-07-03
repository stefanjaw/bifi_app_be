import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";

export interface InvoiceSequenceDocument extends mongoose.Document {
  year: number;
  counter: number;
}

const invoiceSequenceSchema = new Schema(
  {
    year: { type: Number, required: true, unique: true },
    counter: { type: Number, default: 0 },
  },
  { timestamps: false },
);

invoiceSequenceSchema.plugin(paginate);

export const invoiceSequenceModel = mongoose.model<
  InvoiceSequenceDocument,
  PaginateModel<InvoiceSequenceDocument>
>("InvoiceSequence", invoiceSequenceSchema);
