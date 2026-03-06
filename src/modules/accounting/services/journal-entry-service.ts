import mongoose, { ClientSession } from "mongoose";
import { BaseService, ValidationException } from "../../../system";
import { journalEntryModel, JournalEntryDocument, JournalEntryStatus } from "../models/journal-entry.model";
import { JournalEntryDTO } from "../models/journal-entry.dto";

export class JournalEntryService extends BaseService<JournalEntryDocument> {
  constructor() {
    super({
      model: journalEntryModel,
      refFields: [
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
          path: "companyId",
          getModel: () => mongoose.model("Company") as any,
          isArray: false,
        },
      ],
    });
  }

  override async create(data: JournalEntryDTO, session?: ClientSession): Promise<JournalEntryDocument> {
    const lines = data.lines ?? [];
    if (lines.length < 2) {
      throw new ValidationException("Journal entry must have at least 2 lines.");
    }
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new ValidationException("Total debits must equal total credits.");
    }
    return super.create(data as any, session);
  }

  async post(id: string): Promise<JournalEntryDocument> {
    const entry = await this.getById(id, undefined);
    if (!entry) {
      throw new ValidationException("Journal entry not found.");
    }
    const doc = entry as JournalEntryDocument;
    if (doc.status === JournalEntryStatus.POSTED) {
      throw new ValidationException("Journal entry is already posted.");
    }
    const updated = await journalEntryModel.findByIdAndUpdate(
      id,
      { status: JournalEntryStatus.POSTED },
      { new: true }
    );
    return updated as JournalEntryDocument;
  }
}
