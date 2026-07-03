import { ClientSession } from "mongoose";
import {
  BaseService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { paymentModel, PaymentDocument } from "../models/payment.model";
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
}
