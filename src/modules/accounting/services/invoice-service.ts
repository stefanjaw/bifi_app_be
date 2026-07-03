import mongoose, { ClientSession } from "mongoose";
import {
  BaseService,
  ValidationException,
  runTransaction,
} from "../../../system";
import { fireNotification } from "../../notifications/services/notification-service";
import {
  journalEntryModel,
  JournalEntryDocument,
  JournalEntryStatus,
} from "../models/journal-entry.model";
import { PaginateResult } from "mongoose";
import {
  orderByQuery,
  paginationOptions,
} from "../../../system/libraries/base-module/query-options.type";
import { invoiceSequenceModel } from "../models/invoice-sequence.model";
import { journalModel } from "../models/journal.model";
import { AccountingSettingsService } from "./accounting-settings-service";
import { SequenceService } from "../../sequences/services/sequence-service";
import { paymentTermModel } from "../models/payment-term.model";
import { taxModel } from "../models/tax.model";
import { discountModel } from "../models/discount.model";
import {
  paymentModel,
  PaymentType,
  PaymentStatus,
} from "../models/payment.model";
import {
  AccountingInvoiceDTO,
  RegisterPaymentDTO,
} from "../models/invoice.dto";
import {
  ContactDocument,
  PaymentTermDocument,
  JournalDocument,
  UserDocument,
  FiscalPositionDocument,
  CompanyDocument,
  CurrencyDocument,
} from "@mongodb-types";
export class InvoiceService extends BaseService<JournalEntryDocument> {
  constructor() {
    super({
      model: journalEntryModel,
      refFields: [
        {
          path: "contactId",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: false,
        },
        {
          path: "paymentTermId",
          getModel: () =>
            this.connectionManager.getModel<PaymentTermDocument>("PaymentTerm"),
          isArray: false,
        },
        {
          path: "journalId",
          getModel: () =>
            this.connectionManager.getModel<JournalDocument>("Journal"),
          isArray: false,
        },
        {
          path: "salespersonId",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "fiscalPositionId",
          getModel: () =>
            this.connectionManager.getModel<FiscalPositionDocument>(
              "FiscalPosition",
            ),
          isArray: false,
        },
        {
          path: "companyId",
          getModel: () =>
            this.connectionManager.getModel<CompanyDocument>("Company"),
          isArray: false,
        },
        {
          path: "currencyId",
          getModel: () =>
            this.connectionManager.getModel<CurrencyDocument>("Currency"),
          isArray: false,
        },
      ],
    });
  }

  override async getById(
    id: string,
    session: ClientSession | undefined,
  ): Promise<JournalEntryDocument | undefined> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const doc = await model
      .findOne({ _id: id, isInvoice: true })
      .session(session ?? null);
    return doc ?? undefined;
  }

  override async get(
    searchParams: Record<string, any>,
    paginationOptions: undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined,
  ): Promise<JournalEntryDocument[]>;

  override async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions & { paginate: true },
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined,
  ): Promise<PaginateResult<JournalEntryDocument>>;

  override async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions | undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined,
  ): Promise<PaginateResult<JournalEntryDocument> | JournalEntryDocument[]> {
    return super.get(
      { ...searchParams, isInvoice: true },
      paginationOptions as any,
      orderBy,
      count,
      session,
    );
  }

  private async generateNumber(session: ClientSession): Promise<string> {
    const accountingSettingsService = new AccountingSettingsService();
    const seqService = new SequenceService();
    const settings = await accountingSettingsService.getSettings();
    const invoiceSequence = settings?.invoiceSequence as any;
    if (invoiceSequence) {
      const seqId =
        typeof invoiceSequence === "object"
          ? invoiceSequence._id.toString()
          : invoiceSequence.toString();
      return seqService.getNextNumberById(seqId);
    }
    const boundInvoiceSeqModel =
      this.connectionManager.bindModelToDb(invoiceSequenceModel);
    const year = new Date().getFullYear();
    const seq = await boundInvoiceSeqModel.findOneAndUpdate(
      { year },
      { $inc: { counter: 1 } },
      { new: true, upsert: true, session },
    );
    const counter = String(seq.counter).padStart(5, "0");
    return `INV/${year}/${counter}`;
  }

  private calculateDueDate(
    invoiceDate: Date,
    paymentTerm: any,
  ): Date | undefined {
    if (!paymentTerm || !paymentTerm.lines || paymentTerm.lines.length === 0) {
      return undefined;
    }
    const dueDays = paymentTerm.lines[0].dueDays ?? 0;
    const due = new Date(invoiceDate);
    due.setDate(due.getDate() + dueDays);
    return due;
  }

  private calculateLineTotals(lines: any[]): {
    untaxedAmount: number;
    taxAmount: number;
    taxLines: { accountId: string; amount: number }[];
  } {
    let untaxedAmount = 0;
    let taxAmount = 0;
    const taxLines: { accountId: string; amount: number }[] = [];

    for (const line of lines) {
      let lineAmount = (line.quantity ?? 1) * (line.unitPrice ?? 0);

      if (line._discount) {
        if (line._discount.discountType === "percentage") {
          lineAmount = lineAmount * (1 - (line._discount.value ?? 0) / 100);
        } else if (line._discount.discountType === "fixed") {
          lineAmount = Math.max(0, lineAmount - (line._discount.value ?? 0));
        }
      }

      line._computedAmount = lineAmount;
      untaxedAmount += lineAmount;

      for (const tax of line._taxes ?? []) {
        const taxAmt = lineAmount * ((tax.percentage ?? 0) / 100);
        taxAmount += taxAmt;
        if (tax.accountId) {
          const existingLine = taxLines.find(
            (t) =>
              t.accountId.toString() ===
              (tax.accountId._id ?? tax.accountId).toString(),
          );
          if (existingLine) {
            existingLine.amount += taxAmt;
          } else {
            taxLines.push({
              accountId: tax.accountId._id ?? tax.accountId,
              amount: taxAmt,
            });
          }
        }
      }
    }

    return { untaxedAmount, taxAmount, taxLines };
  }

  private async enrichLines(
    rawLines: any[],
    session: ClientSession,
  ): Promise<any[]> {
    const boundTaxModel = this.connectionManager.bindModelToDb(taxModel);
    const boundDiscountModel =
      this.connectionManager.bindModelToDb(discountModel);
    const enrichedLines: any[] = [];
    for (const line of rawLines) {
      const enriched: any = { ...line };
      enriched._taxes =
        line.taxIds && line.taxIds.length > 0
          ? await boundTaxModel
              .find({ _id: { $in: line.taxIds } })
              .session(session)
              .lean()
          : [];
      if (line.discountId) {
        enriched._discount = await boundDiscountModel
          .findById(line.discountId)
          .session(session)
          .lean();
      }
      enrichedLines.push(enriched);
    }
    return enrichedLines;
  }

  private buildJELines(
    enrichedLines: any[],
    taxLines: { accountId: string; amount: number }[],
    totalAmount: number,
    debitAccountId: any,
  ): any[] {
    const productLines = enrichedLines.map((line) => ({
      lineType: "product",
      accountId: line.accountId,
      description: line.description ?? "",
      debit: 0,
      credit: line._computedAmount ?? 0,
      productId: line.productId,
      quantity: line.quantity ?? 1,
      unitPrice: line.unitPrice ?? 0,
      taxIds: line.taxIds ?? [],
      discountId: line.discountId,
      amount: line._computedAmount ?? 0,
    }));

    const taxJELines = taxLines.map((t) => ({
      lineType: "tax",
      accountId: t.accountId,
      description: "Tax",
      debit: 0,
      credit: t.amount,
    }));

    const counterpartLine = debitAccountId
      ? [
          {
            lineType: "counterpart",
            accountId: debitAccountId,
            description: "Accounts Receivable",
            debit: totalAmount,
            credit: 0,
          },
        ]
      : [];

    return [...counterpartLine, ...productLines, ...taxJELines];
  }

  override async create(
    data: AccountingInvoiceDTO,
    session?: ClientSession,
  ): Promise<JournalEntryDocument> {
    return await runTransaction(session, async (s) => {
      const number = await this.generateNumber(s);

      const boundJournalModel =
        this.connectionManager.bindModelToDb(journalModel);
      const journal = await boundJournalModel
        .findById(data.journalId)
        .session(s);
      if (!journal) throw new ValidationException("Journal not found.");

      let paymentTerm: any = null;
      if (data.paymentTermId) {
        const boundPaymentTermModel =
          this.connectionManager.bindModelToDb(paymentTermModel);
        paymentTerm = await boundPaymentTermModel
          .findById(data.paymentTermId)
          .session(s)
          .lean();
      }

      const invoiceDate = new Date(data.invoiceDate);
      const dueDate = data.dueDate
        ? new Date(data.dueDate)
        : this.calculateDueDate(invoiceDate, paymentTerm);

      const rawLines = data.lines ?? [];
      const enrichedLines = await this.enrichLines(rawLines, s);
      const { untaxedAmount, taxAmount, taxLines } =
        this.calculateLineTotals(enrichedLines);
      const totalAmount = untaxedAmount + taxAmount;

      const jeLines = this.buildJELines(
        enrichedLines,
        taxLines,
        totalAmount,
        journal.defaultDebitAccountId,
      );

      const model = this.connectionManager.bindModelToDb(this.model);
      const docs = await model.create(
        [
          {
            isInvoice: true,
            number,
            status: JournalEntryStatus.DRAFT,
            journalId: data.journalId,
            date: invoiceDate,
            currencyId: data.currencyId,
            reference: data.paymentReference,
            contactId: data.contactId,
            paymentTermId: data.paymentTermId,
            dueDate,
            salespersonId: data.salespersonId,
            paymentReference: data.paymentReference,
            fiscalPositionId: data.fiscalPositionId,
            companyId: data.companyId,
            untaxedAmount,
            taxAmount,
            totalAmount,
            amountDue: totalAmount,
            lines: jeLines,
            active: true,
            crEinvoiceType: data.crEinvoiceType,
            crCondicionVentaId: data.crCondicionVentaId,
            crMedioPagoId: data.crMedioPagoId,
            crPlazoCredito: data.crPlazoCredito,
            crCodigoActividadEmisor: data.crCodigoActividadEmisor,
            crCodigoActividadReceptor: data.crCodigoActividadReceptor,
          },
        ],
        { session: s },
      );

      return docs[0];
    });
  }

  override async update(
    data: any,
    session?: ClientSession,
  ): Promise<JournalEntryDocument> {
    return await runTransaction(session, async (s) => {
      const { _id, ...fields } = data;
      const model = this.connectionManager.bindModelToDb(this.model);
      const existing = await model.findById(_id).session(s);
      if (!existing) throw new ValidationException("Invoice not found.");
      if (!existing.isInvoice)
        throw new ValidationException("Document is not an invoice.");

      const boundJournalModel =
        this.connectionManager.bindModelToDb(journalModel);
      const journal = await boundJournalModel
        .findById(fields.journalId ?? existing.journalId)
        .session(s);

      let paymentTerm: any = null;
      const paymentTermId = fields.paymentTermId ?? existing.paymentTermId;
      if (paymentTermId) {
        const boundPaymentTermModel =
          this.connectionManager.bindModelToDb(paymentTermModel);
        paymentTerm = await boundPaymentTermModel
          .findById(paymentTermId)
          .session(s)
          .lean();
      }

      const invoiceDate = fields.invoiceDate
        ? new Date(fields.invoiceDate)
        : existing.date;
      const dueDate = fields.dueDate
        ? new Date(fields.dueDate)
        : fields.invoiceDate
          ? this.calculateDueDate(invoiceDate, paymentTerm)
          : existing.dueDate;

      const rawLines = fields.lines ?? [];
      const productLines = rawLines.filter(
        (l: any) => !l.lineType || l.lineType === "product",
      );
      const enrichedProductLines = await this.enrichLines(productLines, s);
      const { untaxedAmount, taxAmount } =
        this.calculateLineTotals(enrichedProductLines);
      const totalAmount = untaxedAmount + taxAmount;

      const crUpdate: Record<string, any> = {};
      if (fields.crEinvoiceType !== undefined)
        crUpdate.crEinvoiceType = fields.crEinvoiceType;
      if (fields.crCondicionVentaId !== undefined)
        crUpdate.crCondicionVentaId = fields.crCondicionVentaId || null;
      if (fields.crMedioPagoId !== undefined)
        crUpdate.crMedioPagoId = fields.crMedioPagoId || null;
      if (fields.crPlazoCredito !== undefined)
        crUpdate.crPlazoCredito = fields.crPlazoCredito;
      if (fields.crCodigoActividadEmisor !== undefined)
        crUpdate.crCodigoActividadEmisor =
          fields.crCodigoActividadEmisor || null;
      if (fields.crCodigoActividadReceptor !== undefined)
        crUpdate.crCodigoActividadReceptor =
          fields.crCodigoActividadReceptor || null;
      if (fields.crReferenciaInvoiceId !== undefined)
        crUpdate.crReferenciaInvoiceId = fields.crReferenciaInvoiceId || null;
      if (fields.crInformacionReferencia !== undefined)
        crUpdate.crInformacionReferencia = fields.crInformacionReferencia;
      if (fields.crCondicionImpuesto !== undefined)
        crUpdate.crCondicionImpuesto = fields.crCondicionImpuesto || null;
      if (fields.crMontoTotalImpuestoAcreditar !== undefined)
        crUpdate.crMontoTotalImpuestoAcreditar =
          fields.crMontoTotalImpuestoAcreditar;
      if (fields.crMontoTotalGastoAplicable !== undefined)
        crUpdate.crMontoTotalGastoAplicable = fields.crMontoTotalGastoAplicable;
      if (fields.crDetalleMensaje !== undefined)
        crUpdate.crDetalleMensaje = fields.crDetalleMensaje || null;

      return model.findByIdAndUpdate(
        _id,
        {
          journalId: fields.journalId ?? existing.journalId,
          date: invoiceDate,
          currencyId: fields.currencyId ?? existing.currencyId,
          reference: fields.paymentReference ?? existing.paymentReference,
          contactId: fields.contactId ?? existing.contactId,
          paymentTermId,
          dueDate,
          salespersonId: fields.salespersonId ?? existing.salespersonId,
          paymentReference:
            fields.paymentReference ?? existing.paymentReference,
          fiscalPositionId:
            fields.fiscalPositionId ?? existing.fiscalPositionId,
          companyId: fields.companyId ?? existing.companyId,
          untaxedAmount,
          taxAmount,
          totalAmount,
          lines: rawLines,
          ...crUpdate,
        },
        { new: true, session: s },
      ) as any;
    });
  }

  async getPayments(invoiceId: string): Promise<any[]> {
    const boundPaymentModel =
      this.connectionManager.bindModelToDb(paymentModel);
    return boundPaymentModel
      .find({ invoiceId: new mongoose.Types.ObjectId(invoiceId) })
      .lean();
  }

  async registerPayment(
    invoiceId: string,
    data: RegisterPaymentDTO,
    session?: ClientSession,
  ): Promise<any> {
    return await runTransaction(session, async (s) => {
      const model = this.connectionManager.bindModelToDb(this.model);
      const invoice = await model.findById(invoiceId).session(s);
      if (!invoice) throw new ValidationException("Invoice not found.");
      if (!invoice.isInvoice)
        throw new ValidationException("Document is not an invoice.");
      if (invoice.status === JournalEntryStatus.CANCEL)
        throw new ValidationException(
          "Cannot register payment on a cancelled invoice.",
        );

      const boundPaymentModel =
        this.connectionManager.bindModelToDb(paymentModel);
      await boundPaymentModel.create(
        [
          {
            paymentType: PaymentType.INBOUND,
            journalId: data.journalId,
            amount: data.amount,
            currencyId: data.currencyId,
            paymentDate: new Date(data.paymentDate),
            reference: data.reference,
            invoiceId: new mongoose.Types.ObjectId(invoiceId),
            status: PaymentStatus.CONFIRMED,
            active: true,
          },
        ],
        { session: s },
      );

      const allPayments = await boundPaymentModel
        .find({ invoiceId: new mongoose.Types.ObjectId(invoiceId) })
        .session(s)
        .lean();
      const totalPaid = allPayments.reduce(
        (sum, p) => sum + (p.amount ?? 0),
        0,
      );
      const amountDue = Math.max(0, (invoice.totalAmount ?? 0) - totalPaid);

      await model.findByIdAndUpdate(invoiceId, { amountDue }, { session: s });

      // Alert 3: invoice fully paid
      if (amountDue === 0) {
        await fireNotification({
          context: {
            salesperson: (invoice as any).salespersonId,
            creator: (invoice as any).createdBy,
          },
          type: "invoice_paid",
          title: "Invoice fully paid",
          body: `Invoice ${
            (invoice as any).number ?? invoiceId
          } has been fully paid.`,
          link: `/accounting/invoices/edit/${invoiceId}`,
          module: "accounting",
        });
      }

      return allPayments[allPayments.length - 1];
    });
  }

  async post(id: string): Promise<JournalEntryDocument> {
    return await runTransaction(undefined, async (s) => {
      const model = this.connectionManager.bindModelToDb(this.model);
      const invoice = await model.findById(id).session(s);
      if (!invoice) throw new ValidationException("Invoice not found.");
      if (!invoice.isInvoice)
        throw new ValidationException("Document is not an invoice.");
      if (invoice.status !== JournalEntryStatus.DRAFT)
        throw new ValidationException("Only draft invoices can be posted.");

      const result = await model.findByIdAndUpdate(
        id,
        { status: JournalEntryStatus.POSTED },
        { new: true, session: s },
      );

      await fireNotification({
        type: "invoice_posted",
        context: {
          salesperson: (invoice as any).salespersonId,
          creator: (invoice as any).createdBy,
        },
        title: "Invoice posted",
        body: `Invoice ${(invoice as any).number ?? id} has been posted.`,
        link: `/accounting/invoices/edit/${id}`,
        module: "accounting",
      });

      return result as any;
    });
  }

  async cancel(id: string): Promise<JournalEntryDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const invoice = await model.findById(id);
    if (!invoice) throw new ValidationException("Invoice not found.");
    if (!invoice.isInvoice)
      throw new ValidationException("Document is not an invoice.");
    if (invoice.status === JournalEntryStatus.CANCEL)
      throw new ValidationException("Invoice is already cancelled.");

    return model.findByIdAndUpdate(
      id,
      { status: JournalEntryStatus.CANCEL },
      { new: true },
    ) as any;
  }
}
