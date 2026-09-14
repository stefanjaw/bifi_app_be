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

  /**
   * Calculates the schedule of due dates from the payment term installments
   * (Phase 3 / B5 fix). Every installment line (`percentage` + `dueDays`)
   * becomes one due entry: `amount` = proportional share of `invoiceTotal`
   * and `date` = invoiceDate + dueDays.
   * @param invoiceTotal - Grand total of the invoice
   * @param invoiceDate - Invoice date
   * @param paymentTerm - Payment term document (with installment lines)
   * @returns Installment schedule, or undefined when the term has no lines
   */
  private calculateDueDates(
    invoiceTotal: number,
    invoiceDate: Date,
    paymentTerm: any,
  ): { amount: number; date: Date }[] | undefined {
    if (!paymentTerm || !paymentTerm.lines || paymentTerm.lines.length === 0) {
      return undefined;
    }
    const addDays = (base: Date, days: number): Date => {
      const due = new Date(base);
      due.setDate(due.getDate() + (days ?? 0));
      return due;
    };
    const entries = paymentTerm.lines
      .map((l: any) => ({
        dueDays: l.dueDays ?? 0,
        percentage: l.percentage ?? 0,
      }))
      .sort((a: any, b: any) => a.dueDays - b.dueDays);

    // Single 100% (or unspecified) installment keeps the old behaviour:
    // one due date carrying the whole invoice total.
    if (
      entries.length === 1 &&
      (entries[0].percentage === 0 || entries[0].percentage >= 100)
    ) {
      return [
        {
          amount: Number(invoiceTotal.toFixed(2)),
          date: addDays(invoiceDate, entries[0].dueDays),
        },
      ];
    }

    return entries.map((e: any) => ({
      amount: Number((invoiceTotal * (e.percentage / 100)).toFixed(2)),
      date: addDays(invoiceDate, e.dueDays),
    }));
  }

  /**
   * Legacy single due date kept for backwards compatibility: the latest
   * installment date of the schedule (falls back to the invoice date).
   * @param invoiceDate - Invoice date
   * @param paymentTerm - Payment term document
   * @returns The last due date, or undefined without a payment term
   */
  private calculateDueDate(
    invoiceDate: Date,
    paymentTerm: any,
  ): Date | undefined {
    if (!paymentTerm || !paymentTerm.lines || paymentTerm.lines.length === 0) {
      return undefined;
    }
    const lastDueDays = Math.max(
      ...paymentTerm.lines.map((l: any) => l.dueDays ?? 0),
    );
    const due = new Date(invoiceDate);
    due.setDate(due.getDate() + lastDueDays);
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
      // B4 fix: the invoice number is no longer consumed at creation time.
      // It is generated once, when the invoice is posted (see post()), so
      // drafts and pre-post cancellations no longer produce numbering gaps.

      // ---- [1] Load referenced journal and payment term ----
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

      // ---- [2] Enrich incoming lines, compute totals (fixes B1-adjacent) ----
      const rawLines = data.lines ?? [];
      const enrichedLines = await this.enrichLines(rawLines, s);
      const { untaxedAmount, taxAmount, taxLines } =
        this.calculateLineTotals(enrichedLines);
      const totalAmount = untaxedAmount + taxAmount;

      // ---- [3] Due-date schedule from the payment term (Phase 3 / B5) ----
      const dueDate = data.dueDate
        ? new Date(data.dueDate)
        : this.calculateDueDate(invoiceDate, paymentTerm);
      const dueDates = this.calculateDueDates(
        totalAmount,
        invoiceDate,
        paymentTerm,
      );

      // ---- [4] Build the balanced journal-entry lines ----
      const jeLines = this.buildJELines(
        enrichedLines,
        taxLines,
        totalAmount,
        journal.defaultDebitAccountId,
      );

      // ---- [5] Persist the draft invoice (number pending, nothing due) ----
      const model = this.connectionManager.bindModelToDb(this.model);
      const docs = await model.create(
        [
          {
            isInvoice: true,
            status: JournalEntryStatus.DRAFT,
            journalId: data.journalId,
            date: invoiceDate,
            currencyId: data.currencyId,
            reference: data.paymentReference,
            contactId: data.contactId,
            paymentTermId: data.paymentTermId,
            dueDate,
            dueDates,
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
      if (existing.status !== JournalEntryStatus.DRAFT)
        throw new ValidationException(
          "Only draft invoices can be edited. Cancel payments and reopen or cancel the invoice first.",
        );

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
      // Recalculate the due date whenever the invoice date, the payment term
      // or the explicit due date meaning change (fixes B5-adjacent staleness).
      const dueDate = fields.dueDate
        ? new Date(fields.dueDate)
        : fields.invoiceDate || fields.paymentTermId
          ? this.calculateDueDate(new Date(invoiceDate), paymentTerm)
          : existing.dueDate;

      // ---- [2] Due single date + recompute totals from incoming lines ----
      const rawLines = fields.lines ?? [];
      const productLines = rawLines.filter(
        (l: any) => !l.lineType || l.lineType === "product",
      );
      const enrichedProductLines = await this.enrichLines(productLines, s);
      const { untaxedAmount, taxAmount, taxLines } =
        this.calculateLineTotals(enrichedProductLines);
      const totalAmount = untaxedAmount + taxAmount;

      // ---- [3] Due-date schedule from the payment term (Phase 3 / B5) ----
      const dueDates = fields.dueDates?.length
        ? fields.dueDates.map((d: any) => ({
            amount: Number(d.amount),
            date: new Date(d.date),
          }))
        : fields.invoiceDate || fields.paymentTermId || !fields.dueDate
          ? this.calculateDueDates(
              totalAmount,
              new Date(invoiceDate),
              paymentTerm,
            )
          : existing.dueDates;

      // ---- [4] B1 fix: rebuild the computed journal lines ----
      // Always rebuild the computed journal lines (counterpart + product +
      // tax) instead of persisting the raw DTO lines, which would leave the
      // invoice unbalanced.
      const jeLines = this.buildJELines(
        enrichedProductLines,
        taxLines,
        totalAmount,
        journal?.defaultDebitAccountId,
      );

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
          dueDates,
          salespersonId: fields.salespersonId ?? existing.salespersonId,
          paymentReference:
            fields.paymentReference ?? existing.paymentReference,
          fiscalPositionId:
            fields.fiscalPositionId ?? existing.fiscalPositionId,
          companyId: fields.companyId ?? existing.companyId,
          untaxedAmount,
          taxAmount,
          totalAmount,
          lines: jeLines,
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

  /**
   * Registers a payment against a posted invoice (Phase 2 fix).
   * - Runs inside a transaction.
   * - Rejects payments on drafts/cancelled invoices, zero/negative amounts and
   *   overpayments (total paid would exceed the invoice total).
   * - Creates the settlement journal entry that debits the bank account
   *   (from the payment journal) and credits the invoice's receivable account
   *   (the counterpart line of the invoice), so account 430/4xx is relieved.
   * @param invoiceId - The invoice ID
   * @param data - Register payment payload
   * @param session - Optional MongoDB session
   * @returns The last registered payment document
   */
  async registerPayment(
    invoiceId: string,
    data: RegisterPaymentDTO,
    session?: ClientSession,
  ): Promise<any> {
    return await runTransaction(session, async (s) => {
      // ---- [1] Load invoice and validate registers (guards) ----
      const model = this.connectionManager.bindModelToDb(this.model);
      const invoice = await model.findById(invoiceId).session(s);
      if (!invoice) throw new ValidationException("Invoice not found.");
      if (!invoice.isInvoice)
        throw new ValidationException("Document is not an invoice.");
      if (invoice.status === JournalEntryStatus.CANCEL)
        throw new ValidationException(
          "Cannot register payment on a cancelled invoice.",
        );
      if (invoice.status !== JournalEntryStatus.POSTED)
        throw new ValidationException(
          "Payments can only be registered on posted invoices.",
        );
      const paymentAmount = Number(data.amount);
      if (!paymentAmount || paymentAmount <= 0)
        throw new ValidationException(
          "Payment amount must be greater than zero.",
        );

      // ---- [2] Compute outstanding from active confirmed payments ----
      const boundPaymentModel =
        this.connectionManager.bindModelToDb(paymentModel);
      const existingPayments = await boundPaymentModel
        .find({
          invoiceId: new mongoose.Types.ObjectId(invoiceId),
          status: PaymentStatus.CONFIRMED,
          active: true,
        })
        .session(s)
        .lean();
      const alreadyPaid = existingPayments.reduce(
        (sum, p) => sum + (p.amount ?? 0),
        0,
      );
      const pendingDue = Math.max(
        0,
        Number(invoice.totalAmount ?? 0) - alreadyPaid,
      );
      if (pendingDue <= 0)
        throw new ValidationException("Invoice is already fully paid.");
      if (paymentAmount > pendingDue)
        throw new ValidationException(
          `Payment exceeds the outstanding amount (pending ${pendingDue}).`,
        );

      // ---- [3] Create the settlement JE: debit bank, credit AR (430) ----
      // Debit the bank account (payment journal default debit or the
      // receiving journal default) and credit the invoice's receivable
      // account so the ledger reflects the partial collection.
      const boundJournalModel =
        this.connectionManager.bindModelToDb(journalModel);
      const paymentJournal = await boundJournalModel
        .findById(data.journalId)
        .session(s);
      if (!paymentJournal)
        throw new ValidationException("Payment journal not found.");
      const bankAccountId =
        paymentJournal.defaultDebitAccountId ??
        paymentJournal.defaultCreditAccountId;
      const counterpartLine = (invoice.lines ?? []).find(
        (l: any) => l.lineType === "counterpart",
      );
      const counterpartAccountId = counterpartLine?.accountId;
      let settlementEntryId: mongoose.Types.ObjectId | undefined;
      if (bankAccountId && counterpartAccountId) {
        const boundJournalEntryModel =
          this.connectionManager.bindModelToDb(journalEntryModel);
        const entryDocs = await boundJournalEntryModel.create(
          [
            {
              journalId: data.journalId,
              date: new Date(data.paymentDate),
              currencyId: (invoice as any).currencyId,
              status: JournalEntryStatus.POSTED,
              reference:
                data.reference ??
                `Payment of invoice ${(invoice as any).number ?? invoiceId}`,
              lines: [
                {
                  accountId: bankAccountId,
                  debit: paymentAmount,
                  credit: 0,
                  description: `Payment of invoice ${(invoice as any).number ?? invoiceId}`,
                },
                {
                  accountId: counterpartAccountId,
                  debit: 0,
                  credit: paymentAmount,
                  description: "Accounts Receivable settlement",
                },
              ],
            },
          ],
          { session: s },
        );
        settlementEntryId = entryDocs[0]._id;
      }

      // ---- [4] Persist the payment document linked to its JE ----
      const creationResult = await boundPaymentModel.create(
        [
          {
            paymentType: PaymentType.INBOUND,
            journalId: data.journalId,
            amount: paymentAmount,
            currencyId: data.currencyId,
            paymentDate: new Date(data.paymentDate),
            reference: data.reference,
            invoiceId: new mongoose.Types.ObjectId(invoiceId),
            status: PaymentStatus.CONFIRMED,
            journalEntryId: settlementEntryId,
            active: true,
          },
        ],
        { session: s },
      );

      // ---- [5] Recalculate outstanding and the `isFullyPaid` flag ----
      const allPayments = await boundPaymentModel
        .find({
          invoiceId: new mongoose.Types.ObjectId(invoiceId),
          active: true,
        })
        .session(s)
        .lean();
      const totalPaid = allPayments.reduce(
        (sum, p) => sum + (p.amount ?? 0),
        0,
      );
      const amountDue = Math.max(0, (invoice.totalAmount ?? 0) - totalPaid);

      const updateResult = await model
        .findByIdAndUpdate(
          invoiceId,
          { amountDue, isFullyPaid: amountDue === 0 },
          { new: true, session: s },
        )
        .lean();

      // ---- [6] Notify when the invoice is fully paid ----
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

      return creationResult[0];
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

      // B4 fix: the number is assigned exactly once, when the invoice is
      // posted, so drafts and pre-post cancellations leave no gaps.
      if (!invoice.number) {
        const number = await this.generateNumber(s);
        if (number) invoice.number = number;
      }

      const result = await model.findByIdAndUpdate(
        id,
        { status: JournalEntryStatus.POSTED, number: invoice.number },
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

  /**
   * Cancels an invoice (B3 fix).
   * - Runs inside a transaction.
   * - Blocks cancellation of already-cancelled invoices and of invoices with
   *   confirmed payments (those must be reversed first).
   * - When the invoice was already posted, creates a reverting journal entry
   *   (every line flipped Debit<->Credit, linked via `reversalOf`) instead of
   *   silently leaving the original lines in place.
   * @param id - The invoice (JournalEntry) ID
   * @returns The cancelled invoice document
   */
  async cancel(id: string): Promise<JournalEntryDocument> {
    return await runTransaction(undefined, async (s) => {
      // ---- [1] Load invoice guards (exists / is invoice / not cancelled) ----
      const model = this.connectionManager.bindModelToDb(this.model);
      const invoice = await model.findById(id).session(s);
      if (!invoice) throw new ValidationException("Invoice not found.");
      if (!invoice.isInvoice)
        throw new ValidationException("Document is not an invoice.");
      if (invoice.status === JournalEntryStatus.CANCEL)
        throw new ValidationException("Invoice is already cancelled.");

      // ---- [2] Block cancellation while confirmed payments exist ----
      const boundPaymentModel =
        this.connectionManager.bindModelToDb(paymentModel);
      const confirmedPayments = await boundPaymentModel.countDocuments({
        invoiceId: new mongoose.Types.ObjectId(id),
        status: PaymentStatus.CONFIRMED,
      });
      if (confirmedPayments > 0)
        throw new ValidationException(
          "Invoice has confirmed payments. Reverse the payments before cancelling the invoice.",
        );

      // ---- [3] Posted invoices leave a reversing JE (B3 fix) ----
      // Ledger stays balanced after the cancellation.
      if (invoice.status === JournalEntryStatus.POSTED) {
        const reversalLines = (invoice.lines ?? []).map((l: any) => ({
          accountId: l.accountId,
          description: l.description,
          debit: l.credit ?? 0,
          credit: l.debit ?? 0,
          lineType: l.lineType,
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxIds: l.taxIds,
          discountId: l.discountId,
          amount: l.amount,
        }));
        await model.create(
          [
            {
              isInvoice: false,
              journalId: invoice.journalId,
              date: new Date(),
              currencyId: invoice.currencyId,
              status: JournalEntryStatus.POSTED,
              lines: reversalLines,
              reversalOf: invoice._id,
              reference: `Reversal of invoice ${(invoice as any).number ?? id}`,
            },
          ],
          { session: s },
        );
      }

      // ---- [4] Mark cancelled and re-open the outstanding amount ----
      const result = (await model.findByIdAndUpdate(
        id,
        {
          status: JournalEntryStatus.CANCEL,
          amountDue: invoice.totalAmount,
        },
        { new: true, session: s },
      )) as any;

      return result as JournalEntryDocument;
    });
  }

  /**
   * Creates a credit note (NC) against a posted invoice (Phase 4 / B7 fix).
   * Core accounting behaviour, reusable by the CR localization plugin:
   * - Source invoice must be `posted` and have a positive pending amount.
   * - A new `JournalEntry` is created with every line flipped
   *   Debit<->Credit, flagged `isCreditNote` and linked to the source via
   *   `reversalOf`.
   * - The NC gets its own number and its own `amountDue`.
   * - The source invoice's `amountDue`/`isFullyPaid` are reduced by the
   *   credited total (this is the purchase/sales return relief).
   * @param id - The source invoice ID
   * @returns The newly created credit note document
   */
  async createCreditNote(id: string): Promise<JournalEntryDocument> {
    return await runTransaction(undefined, async (s) => {
      // ---- [1] Load source and validate (guards) ----
      const model = this.connectionManager.bindModelToDb(this.model);
      const invoice = await model.findById(id).session(s);
      if (!invoice) throw new ValidationException("Invoice not found.");
      if (!invoice.isInvoice)
        throw new ValidationException("Document is not an invoice.");
      if (invoice.status !== JournalEntryStatus.POSTED)
        throw new ValidationException(
          "Credit notes can only be created against posted invoices.",
        );
      const sourceNumber = (invoice as any).number ?? id;
      const unsettledAmount = Number(
        invoice.amountDue ?? invoice.totalAmount ?? 0,
      );
      if (unsettledAmount <= 0)
        throw new ValidationException(
          "Invoice pending amount is zero; a credit note cannot exceed the pending amount.",
        );

      // ---- [2] Build inverted source lines (B7 fix: Debit<->Credit) ----
      const invertedLines = (invoice.lines ?? []).map((l: any) => ({
        accountId: l.accountId,
        description: l.description,
        debit: l.credit ?? 0,
        credit: l.debit ?? 0,
        lineType: l.lineType,
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxIds: l.taxIds,
        discountId: l.discountId,
        amount: l.amount,
      }));

      // ---- [3] Persist the NC: own number, own outstanding, linked source ----
      const number = await this.generateNumber(s);
      const docs = await model.create(
        [
          {
            isInvoice: true,
            isCreditNote: true,
            status: JournalEntryStatus.POSTED,
            journalId: invoice.journalId,
            date: new Date(),
            currencyId: invoice.currencyId,
            contactId: invoice.contactId,
            paymentTermId: invoice.paymentTermId,
            fiscalPositionId: invoice.fiscalPositionId,
            companyId: invoice.companyId,
            number,
            reference: `Credit note of invoice ${sourceNumber}`,
            untaxedAmount: invoice.untaxedAmount,
            taxAmount: invoice.taxAmount,
            totalAmount: invoice.totalAmount,
            amountDue: invoice.totalAmount,
            lines: invertedLines,
            reversalOf: invoice._id,
            active: true,
          },
        ],
        { session: s },
      );

      // ---- [4] Reduce the source invoice outstanding (return/abono) ----
      const creditTotal = Number(invoice.totalAmount ?? 0);
      const newDue = Math.max(0, unsettledAmount - creditTotal);
      await model.findByIdAndUpdate(
        id,
        { amountDue: newDue, isFullyPaid: newDue === 0 },
        { session: s },
      );

      return docs[0];
    });
  }
}
