import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { JournalEntryDocument } from "../models/journal-entry.model";
import { JournalEntryService } from "../services/journal-entry-service";
import { GlIntegrationService } from "../services/gl-integration-service";
import { GlReportService } from "../services/gl-report-service";
import { ClosingEntriesService } from "../services/closing-entries-service";

/**
 * Controller for the GL sweep actions: posts pending stock movements as
 * journal entries (Phase B2, action-only — no own entity).
 */
export class GlController extends BaseController<JournalEntryDocument> {
  private glIntegrationService = new GlIntegrationService();
  private glReportService = new GlReportService();
  private closingEntriesService = new ClosingEntriesService();

  constructor() {
    super({ service: new JournalEntryService() });
  }

  /** GET /accounting/gl/trial-balance (Ej. 35) */
  async trialBalanceHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, currencyId, accountTypes, hideEmpty } =
        req.query as any;
      const result = await this.glReportService.getTrialBalance({
        from,
        to,
        currencyId,
        accountTypes: accountTypes
          ? String(accountTypes).split(",")
          : undefined,
        hideEmpty: hideEmpty === undefined ? true : hideEmpty === "true",
      });
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  /** GET /accounting/gl/ledger/:accountId (Ej. 6, cuenta T digital) */
  async ledgerHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, currencyId } = req.query as any;
      const result = await this.glReportService.getLedgerForAccount(
        req.params.accountId,
        { from, to, currencyId },
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  /** GET /accounting/gl/income-expenses?period=YYYY (Ej. 36 / cierre) */
  async incomeExpensesHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, currencyId } = req.query as any;
      const result = await this.glReportService.getIncomeExpenses(
        String(period ?? new Date().getUTCFullYear()),
        currencyId,
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  /** GET /accounting/gl/tax-balances (Ej. 19, modelo 303 base) */
  async taxBalancesHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query as any;
      const result = await this.glReportService.getTaxBalances(from, to);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  /** POST /accounting/gl/closing-entries {period, currencyId} (Ej. 33/34) */
  async closingEntriesHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, currencyId } = req.body;
      const result = await this.closingEntriesService.run(period, currencyId);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  /** GET /accounting/gl/trial-balance (Ej. 35) */
  async customerSalesHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, currencyId } = req.query as any;
      const result = await this.glReportService.getCustomerSales(
        String(period ?? new Date().getUTCFullYear()),
        currencyId,
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }

  /** Runs one sweep pass of pending stock movements and reports the result */
  async postPendingHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.glIntegrationService.postPendingMovements();
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  }
}
