import { Router } from "express";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { GlController } from "../controllers/gl-controller";
import { ClosingEntriesDTO } from "../models/closing-entries.dto";

const glController = new GlController();

/** Router for the GL sweep and report actions (Phases B2 + L2) */
export class GlRouter {
  private router = Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    // L2 report routes are DECLARED BEFORE any `GET /:id` — note there is no
    // BaseRoutes GET here, but keeping the same guard convention documented
    // for custom GET routes (payments/advances pattern).

    this.router.get(
      "/accounting/gl/trial-balance",
      authorizeMiddleware("accounting/gl", "read"),
      (req, res, next) => glController.trialBalanceHandler(req, res, next),
    );

    this.router.get(
      "/accounting/gl/ledger/:accountId",
      authorizeMiddleware("accounting/gl", "read"),
      (req, res, next) => glController.ledgerHandler(req, res, next),
    );

    this.router.get(
      "/accounting/gl/income-expenses",
      authorizeMiddleware("accounting/gl", "read"),
      (req, res, next) => glController.incomeExpensesHandler(req, res, next),
    );

    this.router.get(
      "/accounting/gl/tax-balances",
      authorizeMiddleware("accounting/gl", "read"),
      (req, res, next) => glController.taxBalancesHandler(req, res, next),
    );

    this.router.get(
      "/accounting/gl/customer-sales",
      authorizeMiddleware("accounting/gl", "read"),
      (req, res, next) => glController.customerSalesHandler(req, res, next),
    );

    this.router.post(
      "/accounting/gl/closing-entries",
      authorizeMiddleware("accounting/gl", "update"),
      validateBodyMiddleware(ClosingEntriesDTO),
      (req, res, next) => glController.closingEntriesHandler(req, res, next),
    );

    this.router.post(
      "/accounting/gl/post-pending",
      authorizeMiddleware("accounting/gl", "update"),
      (
        req: import("express").Request,
        res: import("express").Response,
        next: import("express").NextFunction,
      ) => glController.postPendingHandler(req, res, next),
    );
  }

  get getRouter() {
    return this.router;
  }
}
