import mongoose, { ClientSession } from "mongoose";
import { BaseService, ValidationException, runTransaction } from "../../../system";
import { journalEntryModel, JournalEntryDocument, JournalEntryStatus } from "../models/journal-entry.model";
import { PaginateResult } from "mongoose";
import { orderByQuery, paginationOptions } from "../../../system/libraries/base-module/query-options.type";
import { invoiceSequenceModel } from "../models/invoice-sequence.model";
import { journalModel } from "../models/journal.model";
import { paymentTermModel } from "../models/payment-term.model";
import { taxModel } from "../models/tax.model";
import { discountModel } from "../models/discount.model";
import { paymentModel, PaymentType, PaymentStatus } from "../models/payment.model";
import { AccountingInvoiceDTO, RegisterPaymentDTO } from "../models/invoice.dto";

export class InvoiceService extends BaseService<JournalEntryDocument> {
  constructor() {
    super({
      model: journalEntryModel,
      refFields: [
        { path: "contactId", getModel: () => mongoose.model("Contact") as any, isArray: false },
        { path: "paymentTermId", getModel: () => mongoose.model("PaymentTerm") as any, isArray: false },
        { path: "journalId", getModel: () => mongoose.model("Journal") as any, isArray: false },
        { path: "salespersonId", getModel: () => mongoose.model("User") as any, isArray: false },
        { path: "fiscalPositionId", getModel: () => mongoose.model("FiscalPosition") as any, isArray: false },
        { path: "companyId", getModel: () => mongoose.model("Company") as any, isArray: false },
        { path: "currencyId", getModel: () => mongoose.model("Currency") as any, isArray: false },
      ],
    });
  }

  override async getById(id: string, session: ClientSession | undefined): Promise<JournalEntryDocument | undefined> {
    const doc = await journalEntryModel.findOne({ _id: id, isInvoice: true }).session(session ?? null);
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
    return super.get({ ...searchParams, isInvoice: true }, paginationOptions as any, orderBy, count, session);
  }

  private async generateNumber(session: ClientSession): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await invoiceSequenceModel.findOneAndUpdate(
      { year },
      { $inc: { counter: 1 } },
      { new: true, upsert: true, session }
    );
    const counter = String(seq.counter).padStart(5, "0");
    return `INV/${year}/${counter}`;
  }

  private calculateDueDate(invoiceDate: Date, paymentTerm: any): Date | undefined {
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
            (t) => t.accountId.toString() === (tax.accountId._id ?? tax.accountId).toString()
          );
          if (existingLine) {
            existingLine.amount += taxAmt;
          } else {
            taxLines.push({ accountId: tax.accountId._id ?? tax.accountId, amount: taxAmt });
          }
        }
      }
    }

    return { untaxedAmount, taxAmount, taxLines };
  }

  private async enrichLines(rawLines: any[], session: ClientSession): Promise<any[]> {
    const enrichedLines: any[] = [];
    for (const line of rawLines) {
      const enriched: any = { ...line };
      enriched._taxes =
        line.taxIds && line.taxIds.length > 0
          ? await taxModel.find({ _id: { $in: line.taxIds } }).session(session).lean()
          : [];
      if (line.discountId) {
        enriched._discount = await discountModel.findById(line.discountId).session(session).lean();
      }
      enrichedLines.push(enriched);
    }
    return enrichedLines;
  }

  private buildJELines(
    enrichedLines: any[],
    taxLines: { accountId: string; amount: number }[],
    totalAmount: number,
    debitAccountId: any
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

  override async create(data: AccountingInvoiceDTO, session?: ClientSession): Promise<JournalEntryDocument> {
    return await runTransaction(session, async (s) => {
      const number = await this.generateNumber(s);

      const journal = await journalModel.findById(data.journalId).session(s);
      if (!journal) throw new ValidationException("Journal not found.");

      let paymentTerm: any = null;
      if (data.paymentTermId) {
        paymentTerm = await paymentTermModel.findById(data.paymentTermId).session(s).lean();
      }

      const invoiceDate = new Date(data.invoiceDate);
      const dueDate = data.dueDate ? new Date(data.dueDate) : this.calculateDueDate(invoiceDate, paymentTerm);

      const rawLines = data.lines ?? [];
      const enrichedLines = await this.enrichLines(rawLines, s);
      const { untaxedAmount, taxAmount, taxLines } = this.calculateLineTotals(enrichedLines);
      const totalAmount = untaxedAmount + taxAmount;

      const jeLines = this.buildJELines(enrichedLines, taxLines, totalAmount, journal.defaultDebitAccountId);

      const docs = await journalEntryModel.create(
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
          },
        ],
        { session: s }
      );

      return docs[0];
    });
  }

  override async update(data: any, session?: ClientSession): Promise<JournalEntryDocument> {
    return await runTransaction(session, async (s) => {
      const { _id, ...fields } = data;
      const existing = await journalEntryModel.findById(_id).session(s);
      if (!existing) throw new ValidationException("Invoice not found.");
      if (!existing.isInvoice) throw new ValidationException("Document is not an invoice.");

      const journal = await journalModel
        .findById(fields.journalId ?? existing.journalId)
        .session(s);

      let paymentTerm: any = null;
      const paymentTermId = fields.paymentTermId ?? existing.paymentTermId;
      if (paymentTermId) {
        paymentTerm = await paymentTermModel.findById(paymentTermId).session(s).lean();
      }

      const invoiceDate = fields.invoiceDate ? new Date(fields.invoiceDate) : existing.date;
      const dueDate = fields.dueDate
        ? new Date(fields.dueDate)
        : fields.invoiceDate
        ? this.calculateDueDate(invoiceDate, paymentTerm)
        : existing.dueDate;

      const rawLines = fields.lines ?? [];
      const enrichedLines = await this.enrichLines(rawLines, s);
      const { untaxedAmount, taxAmount, taxLines } = this.calculateLineTotals(enrichedLines);
      const totalAmount = untaxedAmount + taxAmount;

      const jeLines = this.buildJELines(
        enrichedLines,
        taxLines,
        totalAmount,
        journal?.defaultDebitAccountId
      );

      return journalEntryModel.findByIdAndUpdate(
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
          paymentReference: fields.paymentReference ?? existing.paymentReference,
          fiscalPositionId: fields.fiscalPositionId ?? existing.fiscalPositionId,
          companyId: fields.companyId ?? existing.companyId,
          untaxedAmount,
          taxAmount,
          totalAmount,
          lines: jeLines,
        },
        { new: true, session: s }
      ) as any;
    });
  }

  async getPayments(invoiceId: string): Promise<any[]> {
    return paymentModel.find({ invoiceId: new mongoose.Types.ObjectId(invoiceId) }).lean();
  }

  async registerPayment(invoiceId: string, data: RegisterPaymentDTO, session?: ClientSession): Promise<any> {
    return await runTransaction(session, async (s) => {
      const invoice = await journalEntryModel.findById(invoiceId).session(s);
      if (!invoice) throw new ValidationException("Invoice not found.");
      if (!invoice.isInvoice) throw new ValidationException("Document is not an invoice.");
      if (invoice.status === JournalEntryStatus.CANCEL)
        throw new ValidationException("Cannot register payment on a cancelled invoice.");

      await paymentModel.create(
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
        { session: s }
      );

      const allPayments = await paymentModel
        .find({ invoiceId: new mongoose.Types.ObjectId(invoiceId) })
        .session(s)
        .lean();
      const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
      const amountDue = Math.max(0, (invoice.totalAmount ?? 0) - totalPaid);

      await journalEntryModel.findByIdAndUpdate(invoiceId, { amountDue }, { session: s });

      return allPayments[allPayments.length - 1];
    });
  }

  async post(id: string): Promise<JournalEntryDocument> {
    return await runTransaction(undefined, async (s) => {
      const invoice = await journalEntryModel.findById(id).session(s);
      if (!invoice) throw new ValidationException("Invoice not found.");
      if (!invoice.isInvoice) throw new ValidationException("Document is not an invoice.");
      if (invoice.status !== JournalEntryStatus.DRAFT)
        throw new ValidationException("Only draft invoices can be posted.");

      return journalEntryModel.findByIdAndUpdate(
        id,
        { status: JournalEntryStatus.POSTED },
        { new: true, session: s }
      ) as any;
    });
  }

  async cancel(id: string): Promise<JournalEntryDocument> {
    const invoice = await journalEntryModel.findById(id);
    if (!invoice) throw new ValidationException("Invoice not found.");
    if (!invoice.isInvoice) throw new ValidationException("Document is not an invoice.");
    if (invoice.status === JournalEntryStatus.CANCEL)
      throw new ValidationException("Invoice is already cancelled.");

    return journalEntryModel.findByIdAndUpdate(
      id,
      { status: JournalEntryStatus.CANCEL },
      { new: true }
    ) as any;
  }
}
