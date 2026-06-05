import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export enum JournalEntryStatus {
  DRAFT = "draft",
  POSTED = "posted",
  CANCEL = "cancel",
}

export interface JournalEntryLine {
  accountId: any;
  description?: string;
  debit: number;
  credit: number;
  lineType?: "product" | "tax" | "counterpart";
  productId?: any;
  quantity?: number;
  unitPrice?: number;
  taxIds?: any[];
  discountId?: any;
  amount?: number;
}

export interface JournalEntryDocument extends mongoose.Document {
  journalId: any;
  date: Date;
  reference?: string;
  currencyId: any;
  status: JournalEntryStatus;
  companyId?: any;
  lines: JournalEntryLine[];
  active: boolean;
  isInvoice: boolean;
  number?: string;
  contactId?: any;
  paymentTermId?: any;
  dueDate?: Date;
  salespersonId?: any;
  paymentReference?: string;
  fiscalPositionId?: any;
  untaxedAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  amountDue?: number;
  crEinvoiceType?: string;
  crEinvoiceStatus?: string;
  crClave?: string;
  crNumeroConsecutivo?: string;
  crCondicionVentaId?: any;
  crMedioPagoId?: any;
  crPlazoCredito?: number;
  crHaciendaResponse?: any;
}

const journalEntryLineSchema = new Schema(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      autopopulate: {
        select: "code name",
        maxDepth: 1,
      },
    },
    description: { type: String, required: false },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    lineType: {
      type: String,
      enum: ["product", "tax", "counterpart"],
      required: false,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      required: false,
      autopopulate: { select: "name salePrice", maxDepth: 1 },
    },
    quantity: { type: Number, required: false },
    unitPrice: { type: Number, required: false },
    taxIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tax",
        required: false,
      },
    ],
    discountId: {
      type: Schema.Types.ObjectId,
      ref: "Discount",
      required: false,
    },
    amount: { type: Number, required: false },
  },
  { _id: true }
);

journalEntryLineSchema.plugin(autopopulate);

const journalEntrySchema = new Schema(
  {
    journalId: {
      type: Schema.Types.ObjectId,
      ref: "Journal",
      required: true,
      autopopulate: {
        select: "name code defaultDebitAccountId defaultCreditAccountId",
        maxDepth: 1,
      },
    },
    date: { type: Date, required: true },
    reference: { type: String, required: false },
    currencyId: {
      type: Schema.Types.ObjectId,
      ref: "Currency",
      required: true,
      autopopulate: {
        select: "name code symbol",
        maxDepth: 1,
      },
    },
    status: {
      type: String,
      enum: Object.values(JournalEntryStatus),
      default: JournalEntryStatus.DRAFT,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: false,
      autopopulate: {
        select: "name",
        maxDepth: 1,
      },
    },
    lines: { type: [journalEntryLineSchema], default: [] },
    active: { type: Boolean, default: true },
    isInvoice: { type: Boolean, default: false, index: true },
    number: { type: String, required: false },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      autopopulate: { select: "name lastName", maxDepth: 1 },
    },
    paymentTermId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentTerm",
      required: false,
      autopopulate: { select: "name lines", maxDepth: 1 },
    },
    dueDate: { type: Date, required: false },
    salespersonId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      autopopulate: { select: "name lastName email", maxDepth: 1 },
    },
    paymentReference: { type: String, required: false },
    fiscalPositionId: {
      type: Schema.Types.ObjectId,
      ref: "FiscalPosition",
      required: false,
      autopopulate: { select: "name", maxDepth: 1 },
    },
    untaxedAmount: { type: Number, required: false },
    taxAmount: { type: Number, required: false },
    totalAmount: { type: Number, required: false },
    amountDue: { type: Number, required: false },
    crEinvoiceType: {
      type: String,
      enum: ["FE", "ND", "NC", "TE", "FEC", "FEE", "REP"],
      required: false,
    },
    crEinvoiceStatus: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "received"],
      required: false,
    },
    crClave: { type: String, maxlength: 50, required: false },
    crNumeroConsecutivo: { type: String, maxlength: 20, required: false },
    crCondicionVentaId: {
      type: Schema.Types.ObjectId,
      ref: "CrCondicionVenta",
      required: false,
      autopopulate: { select: "code description", maxDepth: 1 },
    },
    crMedioPagoId: {
      type: Schema.Types.ObjectId,
      ref: "CrMedioPago",
      required: false,
      autopopulate: { select: "code description", maxDepth: 1 },
    },
    crPlazoCredito: { type: Number, required: false },
    crHaciendaResponse: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true }
);

journalEntrySchema.plugin(paginate);
journalEntrySchema.plugin(autopopulate);

export const journalEntryModel = mongoose.model<JournalEntryDocument, PaginateModel<JournalEntryDocument>>(
  "JournalEntry",
  journalEntrySchema
);
