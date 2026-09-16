import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { fileSchema } from "../../../system/libraries/file-storage/file.model";

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
  reversalOf?: any;
  isCreditNote?: boolean;
  sourceStockMovementId?: any;
  contactId?: any;
  paymentTermId?: any;
  dueDate?: Date;
  dueDates?: { amount?: number; date?: Date }[];
  isFullyPaid?: boolean;
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
  crCodigoActividadEmisor?: string;
  crCodigoActividadReceptor?: string;
  crHaciendaResponse?: any;
  crPdfFile?: any;
  crFirmadoXmlFile?: any;
  crHaciendaXmlFile?: any;
  crMensajeReceptorNumeroConsecutivo?: string;
  crCondicionImpuesto?: string;
  crMontoTotalImpuestoAcreditar?: number;
  crMontoTotalGastoAplicable?: number;
  crDetalleMensaje?: string;
  crAcceptanceStatus?: string;
  crAcceptanceHaciendaResponse?: any;
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
      autopopulate: {
        select: "name salePrice codigoComercial unitOfMeasureId productKind",
        maxDepth: 1,
      },
    },
    quantity: { type: Number, required: false },
    unitPrice: { type: Number, required: false },
    taxIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tax",
        required: false,
        autopopulate: {
          select: "name percentage crCodigo crCodigoTarifa crTarifa",
          maxDepth: 1,
        },
      },
    ],
    discountId: {
      type: Schema.Types.ObjectId,
      ref: "Discount",
      required: false,
    },
    amount: { type: Number, required: false },
  },
  { _id: true },
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
    reversalOf: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: false,
      index: true,
    },
    isCreditNote: { type: Boolean, default: false, index: true },
    sourceStockMovementId: {
      type: Schema.Types.ObjectId,
      ref: "StockMovement",
      required: false,
      default: null,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      autopopulate: {
        select:
          "name lastName email vat crVatType state city crDistrito streetAddress crEconomicActivityCodes commercialName",
        maxDepth: 1,
      },
    },
    paymentTermId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentTerm",
      required: false,
      autopopulate: { select: "name lines", maxDepth: 1 },
    },
    dueDate: { type: Date, required: false },
    dueDates: {
      type: [
        new Schema(
          {
            amount: { type: Number, required: false },
            date: { type: Date, required: true },
          },
          { _id: false },
        ),
      ],
      required: false,
    },
    isFullyPaid: { type: Boolean, required: false, index: true },
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
      enum: ["FE", "ND", "NC", "TE", "FEC", "FEE", "REP", "MA", "MAP", "MR"],
      required: false,
    },
    crEinvoiceStatus: {
      type: String,
      enum: [
        "draft",
        "pending",
        "sent",
        "accepted",
        "rejected",
        "received",
        "failed",
      ],
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
    crCodigoActividadEmisor: { type: String, required: false },
    crCodigoActividadReceptor: { type: String, required: false },
    crHaciendaResponse: { type: Schema.Types.Mixed, required: false },
    crReferenciaInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: false,
    },
    crInformacionReferencia: {
      tipoDocIR: { type: String, required: false },
      tipoDocRefOTRO: { type: String, required: false },
      numero: { type: String, required: false },
      fechaEmisionIR: { type: Date, required: false },
      codigo: { type: String, required: false },
      codigoReferenciaOTRO: { type: String, required: false },
      razon: { type: String, maxlength: 180, required: false },
      _id: false,
    },
    crPdfFile: { type: fileSchema, required: false },
    crFirmadoXmlFile: { type: fileSchema, required: false },
    crHaciendaXmlFile: { type: fileSchema, required: false },
    crMensajeReceptorNumeroConsecutivo: { type: String, required: false },
    crCondicionImpuesto: {
      type: String,
      enum: ["01", "02", "03", "04", "05"],
      required: false,
    },
    crMontoTotalImpuestoAcreditar: { type: Number, required: false },
    crMontoTotalGastoAplicable: { type: Number, required: false },
    crDetalleMensaje: { type: String, required: false },
    crAcceptanceStatus: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected"],
      default: "draft",
      required: false,
    },
    crAcceptanceHaciendaResponse: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

journalEntrySchema.plugin(paginate);
journalEntrySchema.plugin(autopopulate);

// One journal entry per stock movement (Phase B2 idempotency): unique only
// when the link exists, so non-GL JEs with null can coexist.
journalEntrySchema.index(
  { sourceStockMovementId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceStockMovementId: { $type: "objectId" } },
  },
);

export const journalEntryModel = mongoose.model<
  JournalEntryDocument,
  PaginateModel<JournalEntryDocument>
>("JournalEntry", journalEntrySchema);
