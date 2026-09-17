import { ClientSession } from "mongoose";
import { BaseService, ValidationException } from "../../../system";
import {
  journalEntryModel,
  JournalEntryDocument,
  JournalEntryStatus,
} from "../models/journal-entry.model";
import { JournalEntryDTO } from "../models/journal-entry.dto";
import {
  JournalDocument,
  CurrencyDocument,
  CompanyDocument,
} from "@mongodb-types";

export class JournalEntryService extends BaseService<JournalEntryDocument> {
  constructor() {
    super({
      model: journalEntryModel,
      refFields: [
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
          path: "companyId",
          getModel: () =>
            this.connectionManager.getModel<CompanyDocument>("Company"),
          isArray: false,
        },
      ],
    });
  }

  override async create(
    data: JournalEntryDTO,
    session?: ClientSession,
  ): Promise<JournalEntryDocument> {
    const lines = data.lines ?? [];
    if (lines.length < 2) {
      throw new ValidationException(
        "Journal entry must have at least 2 lines.",
      );
    }
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new ValidationException("Total debits must equal total credits.");
    }
    return super.create(data as any, session);
  }

  /**
   * Overrides update to protect ledger integrity (Phase L1 pre-condition):
   * only draft journal entries can be edited — posted entries are immutable
   * and cancelled entries stay locked.
   */
  override async update(
    data: JournalEntryDTO | any,
    session?: ClientSession,
  ): Promise<JournalEntryDocument> {
    const id = (data as any)?._id;
    if (id) {
      const existing = await this.getById(id, session);
      const doc = existing as JournalEntryDocument | undefined;
      if (doc && doc.status !== JournalEntryStatus.DRAFT) {
        throw new ValidationException(
          "Only draft journal entries can be edited. Cancel or post first.",
        );
      }
    }
    return super.update(data, session);
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
    // Phase L1 pre-condition: cancelled entries can never be posted —
    // the ledger aggregates trust posted documents only.
    if (doc.status === JournalEntryStatus.CANCEL) {
      throw new ValidationException(
        "Journal entry is cancelled and cannot be posted. Restore it by removing the cancellation source first.",
      );
    }
    const model = this.connectionManager.bindModelToDb(this.model);
    const updated = await model.findByIdAndUpdate(
      id,
      { status: JournalEntryStatus.POSTED },
      { new: true },
    );
    return updated as JournalEntryDocument;
  }
}
