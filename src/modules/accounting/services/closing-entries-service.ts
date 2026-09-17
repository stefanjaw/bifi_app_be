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
    const closingLines: {
      accountId: any;
      description: string;
      debit: number;
      credit: number;
    }[] = [];
    for (const row of expenseRows) {
      if (row.saldo <= 0) continue;
      // Expense has a debit balance (Debe) -> it closes via the credit
      closingLines.push({
        accountId: new mongoose.Types.ObjectId(row.accountId),
        description: `Close expense of ${period}`,
        debit: 0,
        credit: row.saldo,
      });
    }
    for (const row of incomeRows) {
      // Income has a credit balance: raw saldo is negative; its closing
      // amount is the credit magnitude posted on the debit side.
      const creditMagnitude = Math.abs(Math.min(0, row.saldo) * -1);
      if (creditMagnitude <= 0) continue;
      closingLines.push({
        accountId: new mongoose.Types.ObjectId(row.accountId),
        description: `Close income of ${period}`,
        debit: Math.round(creditMagnitude * 100) / 100,
        credit: 0,
      });
    }
    // ---- [4] Result entry: total = amount of both sides ----
    const totalIncome = report.incomeTotal;
    const totalExpense = report.expenseTotal;
    const resultAmount =
      Math.round(Math.abs(totalIncome - totalExpense) * 100) / 100;
    const isProfit = totalIncome > totalExpense;
    // The result is the net effect of asiento 6 & 7 on the equity account:
    // - profit: equity account shows a credit balance of the result amount.
    // Balance: ΣDebe = ΣHaber via a single balancing entry with the equity
    // account itself as the counterpart (Debe/Haber by difference).
    closingLines.push({
      accountId: equityAccount._id,
      description: `P&L result of ${period}`,
      debit: isProfit ? 0 : resultAmount,
      credit: isProfit ? resultAmount : 0,
    });

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
