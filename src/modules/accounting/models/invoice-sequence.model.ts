import mongoose, { Schema } from "mongoose";

export interface InvoiceSequenceDocument extends mongoose.Document {
  year: number;
  counter: number;
}

const invoiceSequenceSchema = new Schema(
  {
    year: { type: Number, required: true, unique: true },
    counter: { type: Number, default: 0 },
  },
  { timestamps: false }
);

export const invoiceSequenceModel = mongoose.model<InvoiceSequenceDocument>(
  "InvoiceSequence",
  invoiceSequenceSchema
);
