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
import { AccountingSettingsService } from "./accounting-settings-service";
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
   * Updates a payment and keeps the derived data consistent:
   * - recalculates the linked invoice's outstanding (BUG-J fix), and
   * - rebuilds the settlement JE LINES when the amount/discount changed
   *   (Phase 6 fix), so the GL entry keeps matching the payment document.
   *   The rebuild is a service-internal cascade that preserves
   *   Σ Debit = Σ Credit; the JE's reference/date stay untouched.
   * @param data - Update payload (`_id` + editable fields)
   * @param session - Optional MongoDB session
   * @returns The updated payment document
   */
  override async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<PaymentDocument> {
    return await runTransaction(session, async (s) => {
      const boundPaymentModel =
        this.connectionManager.bindModelToDb(paymentModel);
      const before = (await boundPaymentModel
        .findById(data._id)
        .session(s)
        .lean()) as any;
      const updated = (await super.update(data, s)) as any;

      const amountChanged =
        !!before &&
        (Number(before.amount ?? 0) !== Number(updated.amount ?? 0) ||
          Number(before.discountAmount ?? 0) !==
            Number(updated.discountAmount ?? 0));
      if (amountChanged && updated.journalEntryId) {
        await this.rebuildSettlementLines(updated, s);
      }

      const invoiceId = updated?.invoiceId?._id?.toString()
        ? updated.invoiceId._id.toString()
        : updated?.invoiceId?.toString();
      if (invoiceId) await this.recalculateInvoiceOutstanding(invoiceId, s);
      return updated as PaymentDocument;
    });
  }

  /**
   * Rebuilds a payment's settlement JE lines after an amount/discount edit
   * (Phase 6). Keeps the orientation rules of create()/registerPayment():
   * standalone payments post the journal's default debit/credit pair;
   * invoice-linked settlements mirror the Phase 2 BUG-K orientation
   * (purchase ⇒ `D AP / [C discount] / C bank`, sales ⇒ `D bank / [D discount] / C AR`).
   * @param payment - The updated payment document
   * @param session - MongoDB session
   */
  private async rebuildSettlementLines(
    payment: any,
    session: ClientSession,
  ): Promise<void> {
    const boundJournalModel =
      this.connectionManager.bindModelToDb(journalModel);
    const boundJournalEntryModel =
      this.connectionManager.bindModelToDb(journalEntryModel);
    const journalEntryId =
      payment.journalEntryId?._id ?? payment.journalEntryId;
    const journal = await boundJournalModel
      .findById(payment.journalId)
      .session(session);
    if (!journal || !journalEntryId) return;
    const amount = Number(payment.amount ?? 0);
    const discountAmount = Number(payment.discountAmount ?? 0);
    const settlingAmount = amount + discountAmount;

    let lines: any[];
    let currencyId: any;
    if (payment.invoiceId) {
      // ---- Invoice-linked settlement: orientation from the invoice's journal ----
      const invoice = await boundJournalEntryModel
        .findById(payment.invoiceId._id ?? payment.invoiceId)
        .session(session);
      if (!invoice) return;
      const counterpartLine = (invoice.lines ?? []).find(
        (l: any) => l.lineType === "counterpart",
      );
      const counterpartAccountId = counterpartLine?.accountId;
      if (!counterpartAccountId) return;
      let discountAccountId: any;
      if (discountAmount > 0) {
        const settings = await new AccountingSettingsService().getSettings();
        discountAccountId =
          (settings as any)?.discountGrantedAccountId?._id ??
          (settings as any)?.discountGrantedAccountId ??
          null;
        if (!discountAccountId) return;
      }
      const invoiceJournal = await boundJournalModel
        .findById(invoice.journalId)
        .session(session);
      const isPurchase = invoiceJournal?.journalType === "purchase";
      currencyId = invoice.currencyId;
      lines = [
        {
          accountId:
            journal.defaultDebitAccountId ?? journal.defaultCreditAccountId,
          debit: isPurchase ? 0 : amount,
          credit: isPurchase ? amount : 0,
          description: `Payment of invoice ${(invoice as any).number ?? ""}`,
        },
        ...(discountAmount > 0
          ? [
              {
                accountId: discountAccountId,
                debit: isPurchase ? 0 : discountAmount,
                credit: isPurchase ? discountAmount : 0,
                description: "Early-payment discount",
              },
            ]
          : []),
        {
          accountId: counterpartAccountId,
          debit: isPurchase ? settlingAmount : 0,
          credit: isPurchase ? 0 : settlingAmount,
          description: isPurchase
            ? "Accounts Payable settlement"
            : "Accounts Receivable settlement",
        },
      ];
    } else {
      // ---- Standalone payment: the journal's default 2-line pair ----
      const debitAccountId = journal.defaultDebitAccountId;
      const creditAccountId = journal.defaultCreditAccountId;
      if (!debitAccountId || !creditAccountId) return;
      currencyId = payment.currencyId;
      lines = [
        { accountId: debitAccountId, debit: amount, credit: 0 },
        { accountId: creditAccountId, debit: 0, credit: amount },
      ];
    }

    // Defensive partida-doble check before persisting the rebuild
    const sumDebit = lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
    const sumCredit = lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);
    if (Math.abs(sumDebit - sumCredit) > 0.0001) return;

    await boundJournalEntryModel.findByIdAndUpdate(
      journalEntryId,
      { lines, currencyId },
      { session },
    );
  }

  /**
   * Confirms a standalone draft payment (BUG-L fix): flips the payment AND
   * its settlement JE to CONFIRMED/POSTED. This is what makes the advance
   * flow reachable (A2b): `GET /payments/advances` requires
   * `status: CONFIRMED, invoiceId: null` — standalone payments are created
   * as DRAFT and can only reach CONFIRMED through this action (status is
   * deliberately not editable via PUT, so this endpoint is the only path).
   * @param paymentId - The payment ID
   * @param session - Optional MongoDB session
   * @returns The confirmed payment document
   */
  async confirm(
    paymentId: string,
    session?: ClientSession,
  ): Promise<PaymentDocument> {
    return await runTransaction(session, async (s) => {
      // ---- [1] Guards: exists and still draft ----
      const boundPaymentModel =
        this.connectionManager.bindModelToDb(paymentModel);
      const payment = await boundPaymentModel.findById(paymentId).session(s);
      if (!payment) throw new ValidationException("Payment not found.");
      if (payment.status !== PaymentStatus.DRAFT)
        throw new ValidationException("Only draft payments can be confirmed.");

      // ---- [2] Post the settlement JE (only when it is still draft) ----
      if (payment.journalEntryId) {
        const boundJournalEntryModel =
          this.connectionManager.bindModelToDb(journalEntryModel);
        const journalEntryId =
          (payment.journalEntryId as any)._id ?? payment.journalEntryId;
        await boundJournalEntryModel.findOneAndUpdate(
          {
            _id: journalEntryId,
            status: JournalEntryStatus.DRAFT,
          },
          { status: JournalEntryStatus.POSTED },
          { session: s },
        );
      }

      // ---- [3] Flip the payment to CONFIRMED ----
      const updated = (await boundPaymentModel
        .findByIdAndUpdate(
          paymentId,
          { status: PaymentStatus.CONFIRMED },
          { session: s, new: true },
        )
        .lean()) as any;
      return updated as PaymentDocument;
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
