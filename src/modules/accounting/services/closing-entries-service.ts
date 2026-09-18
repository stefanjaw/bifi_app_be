import mongoose from "mongoose";
import {
  ConnectionManager,
  runTransaction,
  ValidationException,
} from "../../../system";
import {
  journalEntryModel,
  JournalEntryStatus,
} from "../models/journal-entry.model";
import { accountModel } from "../models/account.model";
import { journalModel } from "../models/journal.model";
import { GlReportService } from "./gl-report-service";

/** Result of one closing run for a fiscal period (Ej. 33 + 34) */
export interface ClosingEntriesResult {
  period: string;
  closingEntryId?: any;
  openingEntryId?: any;
  resultAmount: number;
}

/**
 * Automatic closing entries (Phase L2b): for one fiscal period generates:
 * - asiento 6 (Expenses YTD → credit against result 129-like)
 * - asiento 7 (Income YTD → debit against result 129-like)
 * - asiento 8 (result → equity account)
 * - asiento de apertura inverso para el período siguiente.
 * Idempotent: refuses to double-close — looks for a posted JE with
 * `reference = "Closing entries of YYYY"`.
 * Source data: GlReportService.getIncomeExpenses (posted entries only);
 * the "129-like" result account is the first `type: equity` account.
 */
export class ClosingEntriesService {
  private connectionManager = new ConnectionManager();
  private glReportService = new GlReportService();

  /**
   * Generates the closing entries (asientos 6/7/8 + apertura) for a period
   * @param period - 4-digit fiscal year, e.g. "2026"
   * @param currencyId - Optional currency filter (aggregation only posts
   *   JEs whose currency matches the equity account currency)
   */
  async run(
    period: string,
    currencyId?: string,
  ): Promise<ClosingEntriesResult> {
    // ---- [1] Idempotency: refuse double-close for this period ----
    const boundModel = this.connectionManager.bindModelToDb(journalEntryModel);
    const already = await boundModel
      .findOne({
        reference: `Closing entries of ${period}`,
        status: JournalEntryStatus.POSTED,
      })
      .lean();
    if (already)
      throw new ValidationException(
        `Period ${period} is already closed — a posted closing entry exists.`,
      );

    // ---- [2] Data: YTD income/expense accounts + result (Ej. 33 source) ----
    const report = await this.glReportService.getIncomeExpenses(
      period,
      currencyId,
    );
    const expenseRows = report.rows.filter((r) => r.nature === "expense");
    const incomeRows = report.rows.filter((r) => r.nature === "income");
    if (expenseRows.length === 0 && incomeRows.length === 0)
      throw new ValidationException(
        `No posted income/expense entries for period ${period}; nothing to close.`,
      );

    // Result account: the first equity-type account (129/112-like)
    const boundAccountModel =
      this.connectionManager.bindModelToDb(accountModel);
    const equityAccount = (
      (await boundAccountModel.find({ type: "equity" }).lean()) as any[]
    )[0];
    if (!equityAccount)
      throw new ValidationException("No equity account exists to close to.");

    // Journal to post on: first active general journal (fallback), with
    // its currency as the JE currency (required by the JE schema).
    const boundJournalModel =
      this.connectionManager.bindModelToDb(journalModel);
    const journal = (await boundJournalModel
      .findOne({ journalType: "general", active: true })
      .lean()) as any;
    if (!journal)
      throw new ValidationException(
        "No active general journal exists for the closing entries.",
      );
    if (!journal.currencyId)
      throw new ValidationException(
        "The selected general journal has no currency configured.",
      );

    // ---- [3] Close lines (asientos 6 & 7 combined) in ONE posted JE ----
    // BUG-C fix: `saldo` = debit − credit per account. An account with a
    // DEBIT balance closes via a CREDIT of |saldo|; an account with a
    // CREDIT balance closes via a DEBIT of |saldo|. Flipping the side by
    // sign (instead of dropping "negative" lines) keeps abnormal balances
    // (e.g. a loss caused by a legacy unbalanced JE) balanced — partida
    // doble is never violated.
    const closingLines: {
      accountId: any;
      description: string;
      debit: number;
      credit: number;
    }[] = [];
    for (const row of [...expenseRows, ...incomeRows]) {
      const saldo = Math.round(row.saldo * 100) / 100;
      if (saldo === 0) continue;
      closingLines.push({
        accountId: new mongoose.Types.ObjectId(row.accountId),
        description: `Close ${row.nature} of ${period}`,
        debit: saldo < 0 ? Math.abs(saldo) : 0,
        credit: saldo > 0 ? saldo : 0,
      });
    }
    if (closingLines.length === 0)
      throw new ValidationException(
        `No posted income/expense balances to close for period ${period}.`,
      );

    // ---- [4] Result entry: the equity account takes the difference ----
    // Σ Debit − Σ Credit of the close lines is the period result:
    // - credits > debits (profit): equity shows a credit balance → equity CREDIT.
    // - debits > credits (loss): equity DEBIT — never drop the counterpart.
    const totalDebits = closingLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredits = closingLines.reduce((sum, l) => sum + l.credit, 0);
    const resultAmount =
      Math.round(Math.abs(totalDebits - totalCredits) * 100) / 100;
    const isLoss = totalDebits < totalCredits;
    if (resultAmount > 0) {
      closingLines.push({
        accountId: equityAccount._id,
        description: `P&L result of ${period}`,
        debit: isLoss ? resultAmount : 0,
        credit: isLoss ? 0 : resultAmount,
      });
    }

    // ---- [4b] Defensive partida-doble check (BUG-C fix): auto-derived JEs
    // must satisfy the same Σ Debit = Σ Credit invariant as manual ones ----
    const sumDebit = closingLines.reduce((sum, l) => sum + l.debit, 0);
    const sumCredit = closingLines.reduce((sum, l) => sum + l.credit, 0);
    if (Math.abs(sumDebit - sumCredit) > 0.0001)
      throw new ValidationException(
        `Closing entry unbalanced (Σ debits ${sumDebit} ≠ Σ credits ${sumCredit}).`,
      );

    // ---- [5] Opening entry: full inversion for the next period ----
    const nextPeriod = String(Number(period) + 1);
    const openingLines = closingLines.map((l) => ({
      accountId: l.accountId,
      description: l.description,
      debit: l.credit,
      credit: l.debit,
    }));

    return await runTransaction(undefined, async (session) => {
      const boundJournalEntryModel =
        this.connectionManager.bindModelToDb(journalEntryModel);
      const closingDocs = await boundJournalEntryModel.create(
        [
          {
            journalId: journal._id,
            date: new Date(Date.UTC(Number(period) + 1, 0, 0)),
            status: JournalEntryStatus.POSTED,
            reference: `Closing entries of ${period}`,
            currencyId: journal.currencyId,
            lines: closingLines,
            active: true,
          },
        ],
        { session },
      );
      const openingDocs = await boundJournalEntryModel.create(
        [
          {
            journalId: journal._id,
            date: new Date(Date.UTC(Number(period) + 1, 0, 1)),
            status: JournalEntryStatus.POSTED,
            reference: `Opening entries of ${nextPeriod}`,
            currencyId: journal.currencyId,
            lines: openingLines,
            active: true,
          },
        ],
        { session },
      );

      return {
        period,
        closingEntryId: closingDocs[0]._id,
        openingEntryId: openingDocs[0]._id,
        resultAmount,
      };
    });
  }
}
