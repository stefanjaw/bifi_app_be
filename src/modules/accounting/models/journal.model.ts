import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export enum JournalType {
  SALES = "sales",
  PURCHASE = "purchase",
  CASH = "cash",
  BANK = "bank",
  GENERAL = "general",
}

export interface JournalDocument extends mongoose.Document {
  name: string;
  code: string;
  journalType: JournalType;
  defaultDebitAccountId?: any;
  defaultCreditAccountId?: any;
  currencyId?: any;
  active: boolean;
}

const journalSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    journalType: {
      type: String,
      enum: Object.values(JournalType),
      required: true,
    },
    defaultDebitAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
      autopopulate: {
        select: "code name",
        maxDepth: 1,
      },
    },
    defaultCreditAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: false,
      autopopulate: {
        select: "code name",
        maxDepth: 1,
      },
    },
    currencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: false,
      autopopulate: {
        select: "name code symbol",
        maxDepth: 1,
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

journalSchema.plugin(paginate);
journalSchema.plugin(autopopulate);

export const journalModel = mongoose.model<JournalDocument, PaginateModel<JournalDocument>>(
  "Journal",
  journalSchema
);
