import mongoose, { ClientSession } from "mongoose";
import { BaseService, runTransaction, ValidationException } from "../../../system";
import { paymentModel, PaymentDocument } from "../models/payment.model";
import { journalEntryModel, JournalEntryStatus } from "../models/journal-entry.model";
import { journalModel } from "../models/journal.model";
import { PaymentDTO } from "../models/payment.dto";

export class PaymentService extends BaseService<PaymentDocument> {
  constructor() {
    super({
      model: paymentModel,
      refFields: [
        {
          path: "partnerId",
          getModel: () => mongoose.model("Contact") as any,
          isArray: false,
        },
        {
          path: "journalId",
          getModel: () => mongoose.model("Journal") as any,
          isArray: false,
        },
        {
          path: "currencyId",
          getModel: () => mongoose.model("Currency") as any,
          isArray: false,
        },
        {
          path: "journalEntryId",
          getModel: () => mongoose.model("JournalEntry") as any,
          isArray: false,
        },
      ],
    });
  }

  override async create(data: PaymentDTO, session?: ClientSession): Promise<PaymentDocument> {
    return await runTransaction(session, async (s) => {
      const journal = await journalModel.findById(data.journalId).session(s);
      if (!journal) {
        throw new ValidationException("Journal not found.");
      }

      const debitAccountId = journal.defaultDebitAccountId;
      const creditAccountId = journal.defaultCreditAccountId;

      let paymentData: any = { ...data };

      if (debitAccountId && creditAccountId) {
        const entry = await journalEntryModel.create(
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
          { session: s }
        );
        paymentData.journalEntryId = entry[0]._id;
      }

      return super.create(paymentData, s);
    });
  }
}
