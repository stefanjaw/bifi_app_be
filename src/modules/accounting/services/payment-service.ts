import mongoose, { ClientSession } from "mongoose";
import {
  BaseService,
  runTransaction,
  ValidationException,
} from "../../../system";
import {
  paymentModel,
  PaymentDocument,
  PaymentStatus,
  PaymentType,
} from "../models/payment.model";
import {
  journalEntryModel,
  JournalEntryStatus,
} from "../models/journal-entry.model";
import { journalModel } from "../models/journal.model";
import { PaymentDTO } from "../models/payment.dto";
import {
  ContactDocument,
  JournalDocument,
  CurrencyDocument,
  JournalEntryDocument,
} from "@mongodb-types";

export class PaymentService extends BaseService<PaymentDocument> {
  constructor() {
    super({
      model: paymentModel,
      refFields: [
        {
          path: "partnerId",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: false,
        },
        {
          path: "journalId",
          getModel: () =>
            this.connectionManager.getModel<JournalDocument>("Journal"),
          isArray: false,
        },
        {
          path: "currencyId",
          getModel: () =>
            this.connectionManager.getModel<CurrencyDocument>("Currency"),
          isArray: false,
        },
        {
          path: "journalEntryId",
          getModel: () =>
            this.connectionManager.getModel<JournalEntryDocument>(
              "JournalEntry",
            ),
          isArray: false,
        },
      ],
    });
  }

  override async create(
    data: PaymentDTO,
    session?: ClientSession,
  ): Promise<PaymentDocument> {
    return await runTransaction(session, async (s) => {
      // ---- [1] Load the journal for the default posting accounts ----
      const boundJournalModel =
        this.connectionManager.bindModelToDb(journalModel);
      const journal = await boundJournalModel
        .findById(data.journalId)
        .session(s);
      if (!journal) {
        throw new ValidationException("Journal not found.");
      }

      const debitAccountId = journal.defaultDebitAccountId;
      const creditAccountId = journal.defaultCreditAccountId;

      // ---- [2] Free-standing payments also get a 2-line JE (B4: no number) ----
      let paymentData: any = { ...data };

      if (debitAccountId && creditAccountId) {
        const boundJournalEntryModel =
          this.connectionManager.bindModelToDb(journalEntryModel);
        const entry = await boundJournalEntryModel.create(
          [
            {
              journalId: data.journalId,
              date: data.paymentDate,
              reference: data.reference,
              currencyId: data.currencyId,
              status: JournalEntryStatus.DRAFT,
              lines: [
                { accountId: debitAccountId, debit: data.amount, credit: 0 },
                { accountId: creditAccountId, debit: 0, credit: data.amount },
              ],
            },
          ],
          { session: s },
        );
        paymentData.journalEntryId = entry[0]._id;
      }

      return super.create(paymentData, s);
    });
  }

  /**
   * Lists advance payments available for application (Phase A2b):
   * confirmed, active payments not linked/applied to any invoice, optionally
   * filtered by partner.
   * @param partnerId - Optional contact ID filter
   * @returns Pending advance payments
   */
  async getPendingAdvances(partnerId?: string): Promise<PaymentDocument[]> {
    const boundPaymentModel =
      this.connectionManager.bindModelToDb(paymentModel);
    const filter: Record<string, any> = {
      invoiceId: null,
      appliedInvoiceId: null,
      status: PaymentStatus.CONFIRMED,
      active: true,
      amount: { $gt: 0 },
    };
    if (partnerId) filter.partnerId = new mongoose.Types.ObjectId(partnerId);
    return boundPaymentModel.find(filter).lean() as any;
  }

  /**
   * Soft-deletes a payment and re-opens the linked invoice's outstanding
   * amount (Phase 2 fix): recalculates `amountDue` and `isFullyPaid` on the
   * invoice from the remaining active confirmed payments.
   * @param _id - The payment ID
   * @param session - Optional MongoDB session
   * @returns True when the payment has been deleted
   */
  override async delete(
    _id: string,
    session: ClientSession | undefined = undefined,
  ): Promise<boolean> {
    return await runTransaction<boolean>(session, async (newSession) => {
      // ---- [1] Soft-delete and resume ----
      const boundPaymentModel =
        this.connectionManager.bindModelToDb(paymentModel);
      const payment = await boundPaymentModel.findById(_id).session(newSession);
      const deleted = await super.delete(_id, newSession);

      // ---- [2] Recalculate the linked invoice's outstanding (if any) ----
      if (payment?.invoiceId && typeof payment.invoiceId !== "undefined") {
        const invoiceId = (payment.invoiceId as any)._id?.toString()
          ? (payment.invoiceId as any)._id.toString()
          : payment.invoiceId.toString();
        await this.recalculateInvoiceOutstanding(invoiceId, newSession);
      }

      return deleted;
    });
  }

  /**
   * Applies a customer advance (anticipo) to a posted invoice (Phase A2b).
   * The advance payment was originally booked as bank debit / client
   * advances credit (438-equivalent via the journal's default credit
   * account). Applying it creates the transfer JE: debit the advances
   * account (the originating journal's `defaultCreditAccountId`) / credit
   * the invoice's receivable account (its counterpart line), links the
   * payment to the invoice (`invoiceId` + `appliedInvoiceId`) and recalcs
   * the invoice's outstanding.
   * @param paymentId - The advance payment ID
   * @param invoiceId - Target posted invoice ID
   * @param session - Optional MongoDB session
   * @returns The updated payment document
   */
  async apply(
    paymentId: string,
    invoiceId: string,
    session?: ClientSession,
  ): Promise<PaymentDocument> {
    return await runTransaction(session, async (s) => {
      // ---- [1] Guards: valid unapplied inbound advance ----
      const boundPaymentModel =
        this.connectionManager.bindModelToDb(paymentModel);
      const payment = await boundPaymentModel.findById(paymentId).session(s);
      if (!payment) throw new ValidationException("Payment not found.");
      if (payment.paymentType !== PaymentType.INBOUND)
        throw new ValidationException(
          "Only inbound payments can be applied as advances.",
        );
      if (payment.status !== PaymentStatus.CONFIRMED)
        throw new ValidationException(
          "Only confirmed payments can be applied as advances.",
        );
      if (payment.appliedInvoiceId || payment.invoiceId)
        throw new ValidationException(
          "This payment is already linked to an invoice and cannot be re-applied.",
        );
      const amount = Number(payment.amount ?? 0);
      if (amount <= 0)
        throw new ValidationException(
          "The advance amount must be greater than zero.",
        );

      // ---- [2] Guards: posted invoice with positive pending ----
      const boundJournalEntryModel =
        this.connectionManager.bindModelToDb(journalEntryModel);
      const invoice = await boundJournalEntryModel
        .findById(invoiceId)
        .session(s);
      if (!invoice) throw new ValidationException("Invoice not found.");
      if (!invoice.isInvoice)
        throw new ValidationException("Document is not an invoice.");
      if (invoice.status !== JournalEntryStatus.POSTED)
        throw new ValidationException(
          "Advances can only be applied to posted invoices.",
        );
      if (Number(invoice.amountDue ?? 0) <= 0)
        throw new ValidationException("Invoice is already fully paid.");
      if (amount > Number(invoice.amountDue ?? 0))
        throw new ValidationException(
          `The advance amount exceeds the invoice's pending amount (${invoice.amountDue}).`,
        );

      // ---- [3] JE: debit advances account, credit the receivable ----
      const boundJournalModel =
        this.connectionManager.bindModelToDb(journalModel);
      const advanceJournal = await boundJournalModel
        .findById(payment.journalId)
        .session(s);
      const advancesAccountId = advanceJournal?.defaultCreditAccountId;
      const counterpartLine = (invoice.lines ?? []).find(
        (l: any) => l.lineType === "counterpart",
      );
      const receivableAccountId = counterpartLine?.accountId;
      let appliedJournalEntryId: mongoose.Types.ObjectId | undefined;
      if (advancesAccountId && receivableAccountId) {
        const entryDocs = await boundJournalEntryModel.create(
          [
            {
              journalId: (advanceJournal as any)._id,
              date: new Date(),
              currencyId: (invoice as any).currencyId,
              status: JournalEntryStatus.POSTED,
              reference: `Advance applied to invoice ${(invoice as any).number ?? invoiceId}`,
              lines: [
                {
                  accountId: advancesAccountId,
                  debit: amount,
                  credit: 0,
                  description: "Customer advances applied",
                },
                {
                  accountId: receivableAccountId,
                  debit: 0,
                  credit: amount,
                  description: "Accounts Receivable settlement",
                },
              ],
            },
          ],
          { session: s },
        );
        appliedJournalEntryId = entryDocs[0]._id;
      }

      // ---- [4] Link the advance to the invoice and recalc outstanding ----
      await boundPaymentModel.findByIdAndUpdate(
        paymentId,
        {
          invoiceId: new mongoose.Types.ObjectId(invoiceId),
          appliedInvoiceId: new mongoose.Types.ObjectId(invoiceId),
          appliedJournalEntryId,
        },
        { session: s },
      );
      await this.recalculateInvoiceOutstanding(invoiceId, s);

      const updated = await boundPaymentModel
        .findById(paymentId)
        .session(s)
        .lean();
      return updated as unknown as PaymentDocument;
    });
  }

  /**
   * Recalculates `amountDue` and `isFullyPaid` for an invoice from its active
   * confirmed payments. Used after payments are created, deleted or reversed.
   * @param invoiceId - The invoice ID
   * @param session - MongoDB session
   * @returns Nothing; throws when the invoice does not exist
   */
  async recalculateInvoiceOutstanding(
    invoiceId: string,
    session?: ClientSession,
  ): Promise<void> {
    // ---- [1] Load the invoice (no-op when missing) ----
    const boundPaymentModel =
      this.connectionManager.bindModelToDb(paymentModel);
    const boundJournalEntryModel =
      this.connectionManager.bindModelToDb(journalEntryModel);
    const invoice = await boundJournalEntryModel
      .findById(invoiceId)
      .session(session ?? null);
    if (!invoice) return;

    // ---- [2] Sum only active confirmed payments (soft-deleted excluded) ----
    const activePayments = await boundPaymentModel
      .find({
        invoiceId: new mongoose.Types.ObjectId(invoiceId.toString()),
        status: PaymentStatus.CONFIRMED,
        active: true,
      })
      .session(session ?? null)
      .lean();
    const totalPaid = activePayments.reduce(
      (sum, p) => sum + (p.amount ?? 0) + (p.discountAmount ?? 0),
      0,
    );
    const amountDue = Math.max(0, invoice.totalAmount ?? 0) - totalPaid;

    // ---- [3] Persist amountDue + isFullyPaid on the invoice ----
    await boundJournalEntryModel
      .findByIdAndUpdate(
        invoiceId,
        { amountDue, isFullyPaid: amountDue === 0 },
        { session: session ?? null },
      )
      .setOptions({ new: true });
  }
}
