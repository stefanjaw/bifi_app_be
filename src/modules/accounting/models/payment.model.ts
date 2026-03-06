import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export enum PaymentType {
  INBOUND = "inbound",
  OUTBOUND = "outbound",
}

export enum PaymentStatus {
  DRAFT = "draft",
  CONFIRMED = "confirmed",
}

export interface PaymentDocument extends mongoose.Document {
  paymentType: PaymentType;
  partnerId?: any;
  journalId: any;
  amount: number;
  currencyId: any;
  paymentDate: Date;
  reference?: string;
  journalEntryId?: any;
  invoiceId?: any;
  exchangeRate?: number;
  status: PaymentStatus;
  active: boolean;
}

const paymentSchema = new Schema(
  {
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      autopopulate: {
        select: "name lastName email",
        maxDepth: 1,
      },
    },
    journalId: {
      type: Schema.Types.ObjectId,
      ref: "Journal",
      required: true,
      autopopulate: {
        select: "name code",
        maxDepth: 1,
      },
    },
    amount: { type: Number, required: true, min: 0 },
    currencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
      autopopulate: {
        select: "name code symbol",
        maxDepth: 1,
      },
    },
    paymentDate: { type: Date, required: true },
    reference: { type: String, required: false },
    journalEntryId: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: false,
    },
    exchangeRate: { type: Number, required: false },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.DRAFT,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: false,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

paymentSchema.plugin(paginate);
paymentSchema.plugin(autopopulate);

export const paymentModel = mongoose.model<PaymentDocument, PaginateModel<PaymentDocument>>(
  "Payment",
  paymentSchema
);
