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
      (sum, p) => sum + (p.amount ?? 0),
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
