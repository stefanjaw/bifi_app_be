import mongoose from "mongoose";
import { ConnectionManager } from "../../../system";
import { accountModel } from "../models/account.model";
import {
  journalEntryModel,
  JournalEntryStatus,
} from "../models/journal-entry.model";
import { taxModel } from "../models/tax.model";
import { ContactDocument, CurrencyDocument } from "@mongodb-types";

/** One aggregated row of the trial balance (per account + currency) */
export interface TrialBalanceRow {
  accountId: string;
  accountCode?: string;
  accountName?: string;
  accountType?: string;
  currencyId: string;
  currencyCode?: string;
  debit: number;
  credit: number;
  /** debit - credit (raw); nature presentation comes from account.type */
  saldo: number;
}

/** Full trial balance (Ej. 35) */
export interface TrialBalanceReport {
  from?: Date;
  to?: Date;
  currencyId?: string;
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}

/** One line of the detailed ledger (Ej. 6, digital T-account) */
export interface LedgerLine {
  date: Date;
  journalEntryId: string;
  reference?: string;
  currencyId: string;
  description?: string;
  debit: number;
  credit: number;
  runningSaldo: number;
}

/** Detailed ledger for one account (Ej. 6) */
export interface LedgerReport {
  accountId: string;
  from?: Date;
  to?: Date;
  currencyId?: string;
  openingBalance: number;
  rows: LedgerLine[];
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
}

/** Income/expense account totals for one fiscal period (PyG / closing base) */
export interface IncomeExpenseReport {
  period: string;
  from: Date;
  to: Date;
  rows: (TrialBalanceRow & { nature: "income" | "expense" })[];
  incomeTotal: number;
  expenseTotal: number;
  result: number;
}

/** Tax-account totals (472/477-like) per currency for a period */
export interface TaxBalanceRow {
  taxAccountId: string;
  taxName?: string;
  taxType?: string;
  currencyId: string;
  currencyCode?: string;
  debit: number;
  credit: number;
  saldo: number;
}

/** Customer sales totals for one year (Ej. 9 rappel base) */
export interface CustomerSalesRow {
  contactId: string;
  currencyId: string;
  currencyCode?: string;
  sales: number;
}

/**
 * General Ledger reports (Phase L1): turns posted journal entries into
 * aggregated balances — the module's first read-side for the ledger.
 *
 * Grouping is per (line.accountId, header.currencyId), following ERP
 * standard practice (Oracle / Business Central parallel currencies): every
 * journal entry is single-currency by schema, so the ΣDebe=ΣHaber identity
 * holds strictly per currency; presenting a company functional currency
 * would require per-entry exchange rates on the JE (future schema).
 *
 * Filters apply ONLY to `status:'posted'` entries; NC (`isCreditNote`) and
 * reversal JEs are included as real postings. The date filter applies to
 * the JE header (lines have no date). Multi-tenant binding is done through
 * the per-call `bindModelToDb`; cross-module hydration (currency, contacts)
 * uses `getModel` string naming to avoid import cycles.
 */
export class GlReportService {
  private connectionManager = new ConnectionManager();

  /**
   * Builds the header date range of the $match; when `to` is set it covers
   * the whole end-of-day of that date
   * @param from - Period start (inclusive)
   * @param to - Period end (inclusive)
   * @returns Mongo date match fragment, or undefined when unbounded
   */
  private static buildDateMatch(from?: Date, to?: Date): any {
    const match: any = {};
    if (from) match.$gte = from;
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      match.$lte = end;
    }
    return Object.keys(match).length ? match : undefined;
  }

  /**
   * Normalizes optional string dates into Date objects
   * @param value - ISO string or Date
   * @param fieldName - Field name for error reporting
   * @returns Parsed Date, or undefined when absent
   */
  private static parseDate(
    value: string | Date | undefined,
    fieldName: string,
  ) {
    if (!value) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) {
      throw new mongoose.Error(`Invalid ${fieldName}: ${value}`);
    }
    return d;
  }

  /**
   * Aggregates posted journal entries per (line.accountId, header.currencyId)
   * @param params.from - Period start (inclusive)
   * @param params.to - Period end (inclusive, whole day)
   * @param params.currencyId - Optional currency filter (ObjectId string)
   * @param params.accountTypes - Optional account-nature filter
   * @param params.hideEmpty - Hide accounts with no activity (default true)
   * @returns Trial balance rows + totals with the balance identity check
   */
  async getTrialBalance(params: {
    from?: string | Date;
    to?: string | Date;
    currencyId?: string;
    accountTypes?: string[];
    hideEmpty?: boolean;
  }): Promise<TrialBalanceReport> {
    // ---- [1] Build the $match from posted entries + period + currency ----
    // BUG-H fix: reversal JEs (`reversalOf` set) are excluded. Their
    // cancelled originals are already excluded by the status filter —
    // including the reversal alone would flip the cancelled invoice's
    // impact instead of netting it to zero (cancel + reversal = no GL
    // effect by design).
    const from = GlReportService.parseDate(params.from, "from");
    const to = GlReportService.parseDate(params.to, "to");
    const dateMatch = GlReportService.buildDateMatch(from, to);
    const match: any = {
      status: JournalEntryStatus.POSTED,
      active: true,
      reversalOf: { $exists: false },
    };
    if (dateMatch) match.date = dateMatch;
    if (params.currencyId)
      match.currencyId = new mongoose.Types.ObjectId(params.currencyId);

    // ---- [2] Aggregate per (line.accountId, header.currencyId) ----
    const boundModel = this.connectionManager.bindModelToDb(journalEntryModel);
    const grouped = (await boundModel.aggregate([
      { $match: match },
      { $unwind: "$lines" },
      {
        $group: {
          _id: {
            accountId: "$lines.accountId",
            currencyId: "$currencyId",
          },
          debit: { $sum: "$lines.debit" },
          credit: { $sum: "$lines.credit" },
        },
      },
      {
        $project: {
          accountId: "$_id.accountId",
          currencyId: "$_id.currencyId",
          debit: 1,
          credit: 1,
          saldo: { $subtract: ["$debit", "$credit"] },
        },
      },
    ])) as any[];

    // ---- [3] Bulk hydration of accounts and currency labels ----
    const accountIds = [
      ...new Set(grouped.map((g: any) => g.accountId.toString())),
    ];
    const boundAccountModel =
      this.connectionManager.bindModelToDb(accountModel);
    const accounts = (await boundAccountModel
      .find({ _id: { $in: accountIds } })
      .lean()) as any[];
    const accountMap = new Map(accounts.map((a: any) => [a._id.toString(), a]));

    const currencyIds = [
      ...new Set(grouped.map((g: any) => g.currencyId.toString())),
    ];
    const currencyModel =
      this.connectionManager.getModel<CurrencyDocument>("Currency");
    const boundCurrencyModel =
      this.connectionManager.bindModelToDb(currencyModel);
    const currencies = (await boundCurrencyModel
      .find({ _id: { $in: currencyIds } })
      .lean()) as any[];
    const currencyMap = new Map(
      currencies.map((c: any) => [c._id.toString(), c]),
    );

    // ---- [4] Rows sorted by account code, with nature/labels, filtered ----
    const rows: TrialBalanceRow[] = grouped
      .map((g: any) => {
        const acc = accountMap.get(g.accountId.toString());
        return {
          accountId: g.accountId.toString(),
          accountCode: acc?.code,
          accountName: acc?.name,
          accountType: acc?.type,
          currencyId: g.currencyId.toString(),
          currencyCode: currencyMap.get(g.currencyId.toString())?.code,
          debit: Math.round(g.debit * 100) / 100,
          credit: Math.round(g.credit * 100) / 100,
          saldo: Math.round(g.saldo * 100) / 100,
        };
      })
      .filter((r) =>
        params.accountTypes
          ? params.accountTypes.includes(r.accountType ?? "")
          : true,
      )
      .filter((r) =>
        params.hideEmpty === false
          ? true
          : Math.abs(r.debit) > 0 || Math.abs(r.credit) > 0,
      )
      .sort((a, b) => (a.accountCode ?? "").localeCompare(b.accountCode ?? ""));

    const totalDebit =
      Math.round(rows.reduce((sum, r) => sum + r.debit, 0) * 100) / 100;
    const totalCredit =
      Math.round(rows.reduce((sum, r) => sum + r.credit, 0) * 100) / 100;

    return {
      from,
      to,
      currencyId: params.currencyId,
      rows,
      totalDebit,
      totalCredit,
      balanced: Math.abs(totalDebit - totalCredit) <= 0.01,
    };
  }

  /**
   * Detailed ledger for one account (Ej. 6, digital T-account):
   * opening balance from posted entries prior to `from`, then movements
   * within the period with a running saldo. Optional currency filter.
   * @param accountId - The GL account to inspect
   * @param params.from - Period start (exclusive for the opening balance)
   * @param params.to - Period end (inclusive, whole day)
   * @param params.currencyId - Optional currency filter
   */
  async getLedgerForAccount(
    accountId: string,
    params: {
      from?: string | Date;
      to?: string | Date;
      currencyId?: string;
    } = {},
  ): Promise<LedgerReport> {
    if (!mongoose.Types.ObjectId.isValid(accountId))
      throw new Error("Invalid accountId");
    const from = GlReportService.parseDate(params.from, "from");
    const to = GlReportService.parseDate(params.to, "to");
    const accountIdObject = new mongoose.Types.ObjectId(accountId);

    // ---- [1] Fetch all posted entries touching the account, up to `to` ----
    // BUG-H fix: exclude reversal JEs (see getTrialBalance) so a cancelled
    // invoice + its reversal net to zero in the ledger too.
    const match: any = {
      status: JournalEntryStatus.POSTED,
      active: true,
      reversalOf: { $exists: false },
      "lines.accountId": accountIdObject,
    };
    const toMatch = GlReportService.buildDateMatch(undefined, to);
    if (toMatch) match.date = toMatch;
    if (params.currencyId)
      match.currencyId = new mongoose.Types.ObjectId(params.currencyId);

    const boundModel = this.connectionManager.bindModelToDb(journalEntryModel);
    const entries = (await boundModel
      .find(match)
      .sort({ date: 1, createdAt: 1 })
      .lean()) as any[];

    const currencyId = params.currencyId || undefined;

    // ---- [2] Replay: accrue opening (before `from`), then movements ----
    let openingBalance = 0;
    let running = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const rows: LedgerLine[] = [];

    for (const entry of entries) {
      for (const line of entry.lines ?? []) {
        const lineAccountId = (line.accountId as any)._id ?? line.accountId;
        if (lineAccountId.toString() !== accountId) continue;
        const delta = (line.debit ?? 0) - (line.credit ?? 0);
        running = Math.round((running + delta) * 100) / 100;
        if (from && new Date(entry.date) < from) {
          // Pre-period: contributes to the opening balance only
          openingBalance += delta;
          continue;
        }
        totalDebit += line.debit ?? 0;
        totalCredit += line.credit ?? 0;
        rows.push({
          date: entry.date,
          journalEntryId: entry._id.toString(),
          reference: entry.reference,
          currencyId: entry.currencyId.toString(),
          description: line.description,
          debit: line.debit ?? 0,
          credit: line.credit ?? 0,
          runningSaldo: Math.round(running * 100) / 100,
        });
      }
    }

    return {
      accountId,
      from,
      to,
      currencyId,
      openingBalance: Math.round(openingBalance * 100) / 100,
      rows,
      closingBalance: Math.round(running * 100) / 100,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
    };
  }

  /**
   * Income/expense totals for one fiscal year (PyG base, Ej. 36, and the
   * source of the automatic closing entries in L2b)
   * @param period - 4-digit fiscal year
   * @param currencyId - Optional currency filter
   */
  async getIncomeExpenses(
    period: string,
    currencyId?: string,
  ): Promise<IncomeExpenseReport> {
    const from = new Date(Date.UTC(Number(period), 0, 1));
    const to = new Date(Date.UTC(Number(period) + 1, 0, 0));
    const trial = await this.getTrialBalance({
      from,
      to,
      currencyId,
      accountTypes: ["income", "expense"],
    });
    const rows: (TrialBalanceRow & {
      nature: "income" | "expense";
    })[] = trial.rows
      .filter((r) => r.accountType === "income" || r.accountType === "expense")
      .map((r) => ({
        ...r,
        nature: r.accountType === "income" ? "income" : "expense",
      }));
    const incomeTotal =
      Math.round(
        rows
          .filter((r) => r.nature === "income")
          .reduce((sum, r) => sum + r.saldo * -1, 0) * 100,
      ) / 100;
    const expenseTotal =
      Math.round(
        rows
          .filter((r) => r.nature === "expense")
          .reduce((sum, r) => sum + r.saldo, 0) * 100,
      ) / 100;
    return {
      period,
      from,
      to,
      rows,
      incomeTotal,
      expenseTotal,
      result: Math.round((incomeTotal - expenseTotal) * 100) / 100,
    };
  }

  /**
   * Tax-account balances (Ej. 19, model 303 base): aggregates only the
   * accounts configured on Tax.accountId (grouped by tax type)
   * @param from - Period start (inclusive)
   * @param to - Period end (inclusive)
   */
  async getTaxBalances(from?: string | Date, to?: string | Date) {
    const boundTaxModel = this.connectionManager.bindModelToDb(taxModel);
    const taxes = (await boundTaxModel
      .find({ accountId: { $ne: null } })
      .lean()) as any[];
    const taxAccounts = taxes
      .map((t: any) => (t.accountId?._id ?? t.accountId)?.toString())
      .filter(Boolean) as string[];
    if (taxAccounts.length === 0)
      return { from, to, rows: [] as TaxBalanceRow[] };
    const trial = await this.getTrialBalance({ from, to, hideEmpty: true });
    const accountById = new Map(
      trial.rows.map((r) => [r.accountId, r.accountId]),
    );
    const taxByAccount = new Map(
      taxes.map((t: any) => [(t.accountId?._id ?? t.accountId).toString(), t]),
    );
    const rows: TaxBalanceRow[] = trial.rows
      .filter((r) => taxByAccount.has(r.accountId))
      .map((r) => {
        const tax = taxByAccount.get(r.accountId);
        return {
          taxAccountId: r.accountId,
          taxName: tax?.name,
          taxType: tax?.taxType,
          currencyId: r.currencyId,
          currencyCode: r.currencyCode,
          debit: r.debit,
          credit: r.credit,
          saldo: r.saldo,
        };
      });
    return { from, to, rows };
  }

  /**
   * Sales per customer during one year (Ej. 9 rappel base): posted
   * invoices grouped by the header contactId, restricted to income-type
   * accounts (multi-currency safe: grouped per contact + currency)
   * @param period - 4-digit fiscal year
   * @param currencyId - Optional currency filter
   */
  async getCustomerSales(period: string, currencyId?: string) {
    const from = new Date(Date.UTC(Number(period), 0, 1));
    const to = new Date(Date.UTC(Number(period) + 1, 0, 0));
    const trial = await this.getTrialBalance({
      from,
      to,
      currencyId,
      accountTypes: ["income"],
    });
    const boundModel = this.connectionManager.bindModelToDb(journalEntryModel);
    const contactModel =
      this.connectionManager.getModel<ContactDocument>("Contact");
    const boundContactModel =
      this.connectionManager.bindModelToDb(contactModel);

    type Row = {
      contactId: string;
      currencyId: string;
      contactName?: string;
      sales: number;
    };
    // Map header contactId -> per currency; lines belong to JE headers.
    const agg = new Map<string, Row>();
    const match: any = {
      status: JournalEntryStatus.POSTED,
      active: true,
      isInvoice: true,
      // BUG-H fix: exclude credit notes/reversals from sales activity —
      // they are inversions of an original invoice, not standalone sales.
      reversalOf: { $exists: false },
      date: {
        $gte: from,
        $lte: new Date(Date.UTC(Number(period) + 1, 0, 0) - 1),
      },
    };
    if (currencyId) match.currencyId = new mongoose.Types.ObjectId(currencyId);
    const invoices = (await boundModel.find(match).lean()) as any[];
    // Pre-quarter of income account ids from the trial rows
    const incomeAccountSet = new Set(trial.rows.map((r) => r.accountId));
    for (const inv of invoices) {
      const contactId = (inv.contactId as any)?._id ?? inv.contactId;
      if (!contactId) continue;
      // sums credit lines on income-type accounts
      let sales = 0;
      for (const line of inv.lines ?? []) {
        const accountId = (line.accountId as any)?._id ?? line.accountId;
        if (!incomeAccountSet.has(accountId?.toString())) continue;
        sales += line.credit ?? 0;
      }
      if (sales <= 0) continue;
      const key = `${contactId.toString()}_${(inv.currencyId as any)?._id?.toString() ?? inv.currencyId?.toString()}`;
      const row: Row = agg.get(key) ?? {
        contactId: contactId.toString(),
        currencyId: (inv.currencyId as any)?._id?.toString() ?? inv.currencyId,
        sales: 0,
      };
      row.sales += sales;
      agg.set(key, row);
    }
    const rows = [...agg.values()];
    const contactIds = [...new Set(rows.map((r) => r.contactId))].filter(
      Boolean,
    );
    const contacts = (await boundContactModel
      .find({ _id: { $in: contactIds } })
      .lean()) as any[];
    const contactNames = new Map(
      contacts.map((c: any) => [c._id.toString(), c]),
    );
    // BUG-B fix: hydrate the currency codes (same bulk pattern as
    // getTrialBalance) so the UI's Currency column resolves.
    const currencyIds = [
      ...new Set(rows.map((r) => r.currencyId?.toString())),
    ].filter(Boolean);
    const currencyModel =
      this.connectionManager.getModel<CurrencyDocument>("Currency");
    const boundCurrencyModel =
      this.connectionManager.bindModelToDb(currencyModel);
    const currencies = (await boundCurrencyModel
      .find({ _id: { $in: currencyIds } })
      .lean()) as any[];
    const currencyCodes = new Map(
      currencies.map((c: any) => [c._id.toString(), c.code]),
    );
    const namedRows = rows.map((row) => ({
      ...row,
      contactName: contactNames.get(row.contactId)?.name ?? "",
      currencyCode: currencyCodes.get(row.currencyId?.toString() ?? "") ?? "",
      sales: Math.round(row.sales * 100) / 100,
    }));
    return { period, from, currencyId, rows: namedRows };
  }
}
