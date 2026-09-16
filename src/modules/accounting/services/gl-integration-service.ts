import mongoose, { ClientSession } from "mongoose";
import { ConnectionManager, runTransaction } from "../../../system";
import { fireNotification } from "../../notifications/services/notification-service";
import { AccountingSettingsService } from "./accounting-settings-service";
import {
  journalEntryModel,
  JournalEntryDocument,
  JournalEntryStatus,
} from "../models/journal-entry.model";
import { journalModel } from "../models/journal.model";
import { stockMovementModel } from "../../inventory/models/stock-movement.model";

/** Shape of the `inventoryAccounts` settings sub-document */
interface InventoryAccounts {
  inventoryAccountId?: any;
  cogsAccountId?: any;
  adjustmentLossAccountId?: any;
  apPendingAccountId?: any;
  defaultCurrencyId?: any;
}

/**
 * Posts stock movements to the general ledger via an idempotent sweep
 * (Phase B2): StockMovementService stays untouched — accounting scans its
 * Movements collection for movements that have NO journal entry yet and
 * creates the double entry for each one, marking it through
 * `sourceStockMovementId` so the same movement is never posted twice.
 *
 * Posting rules — the pair (movement type + referenceType) decides the
 * orientation, so automatic reversals (which copy the original
 * referenceType) remain correct:
 * - OUT + "sales-order"     -> COGS:          Debe 693 / Haber 300
 * - IN  + "sales-order"     -> COGS flip:     Debe 300 / Haber 693
 * - IN  + "purchase-order"  -> receipt:       Debe 300 / Haber 400* (requires apPendingAccountId)
 * - OUT + "purchase-order"  -> receipt flip:  Debe 400 / Haber 300
 * - ADJUSTMENT ±            -> inventory vs adjustmentLossAccountId
 * - transfer-in/-out and manual movements (referenceType "") -> skipped.
 * Soft-fail: missing mapping, journal or currency posts nothing and fires a
 * notification; the sweep never throws and never blocks the stock module.
 */
export class GlIntegrationService {
  private connectionManager = new ConnectionManager();

  /** Reference types that must never post a journal entry */
  private static readonly SKIPPED_REFERENCE_TYPES = new Set([
    "transfer-in",
    "transfer-out",
    "",
  ]);

  /**
   * Runs one sweep pass: posts pending stock movements (those without a
   * journal entry linked via sourceStockMovementId), each in its own
   * transaction so one failure doesn't block the batch.
   * @param limit - Max movements per pass (default 100)
   * @returns Summary of the pass
   */
  async postPendingMovements(limit = 100): Promise<{
    posted: number;
    skipped: number;
    failed: number;
  }> {
    const boundMovementModel =
      this.connectionManager.bindModelToDb(stockMovementModel);
    const boundJournalEntryModel =
      this.connectionManager.bindModelToDb(journalEntryModel);

    // Movements already linked: exclude them from the pending search.
    const linkedJEs = await boundJournalEntryModel
      .distinct("sourceStockMovementId")
      .lean();
    const postedIds = (linkedJEs ?? [])
      .filter((id: any) => id != null)
      .map((id: any) => id.toString());

    const candidates = (await boundMovementModel
      .find({
        _id: { $nin: postedIds },
        // Only postable shapes (see the class rule table): shipments/receipts
        // with a trackable origin, plus adjustments regardless of their
        // referenceType (manual adjustments carry ""/postage-free refTypes).
        $or: [
          { type: { $in: ["ADJUSTMENT"] } },
          {
            type: { $in: ["IN", "OUT"] },
            referenceType: { $in: ["sales-order", "purchase-order"] },
          },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean()) as any[];

    let posted = 0;
    let skipped = 0;
    let failed = 0;
    for (const movement of candidates) {
      try {
        const result = await this.tryPostMovement(movement);
        if (result) posted++;
        else skipped++;
      } catch (error: any) {
        failed++;
        await this.notifySoftFail(movement, error?.message ?? String(error));
      }
    }
    return { posted, skipped, failed };
  }

  /**
   * Attempts to post a single movement; returns undefined when it must be
   * skipped (non-postable reference type, missing mapping/currency/journal)
   * @param movementDoc - Lean stock movement document
   */
  private async tryPostMovement(
    movementDoc: any,
  ): Promise<JournalEntryDocument | undefined> {
    // ---- [1] Skip non-postable reference types ----
    const referenceType = String(movementDoc?.referenceType ?? "");
    if (GlIntegrationService.SKIPPED_REFERENCE_TYPES.has(referenceType)) {
      return undefined;
    }

    // ---- [2] Resolve accounts and amount from settings ----
    const settings = await new AccountingSettingsService().getSettings();
    const accounts: InventoryAccounts =
      (settings as any)?.inventoryAccounts ?? {};
    const inventoryAccount = accounts?.inventoryAccountId?._id ?? null;
    const amount = Number(movementDoc?.totalCost ?? 0);
    const type = String(movementDoc?.type ?? "");
    const adjustmentDirection = String(movementDoc?.adjustmentDirection ?? "");
    const addsStock =
      type === "IN" ||
      (type === "ADJUSTMENT" && adjustmentDirection === "INCREASE");
    if (!(amount > 0) || !inventoryAccount) return undefined;

    // ---- [3] Pair counterpart per (type + referenceType) ----
    let counterpartAccount: any;
    if (type === "ADJUSTMENT") {
      counterpartAccount =
        accounts?.adjustmentLossAccountId?._id ??
        accounts?.adjustmentLossAccountId ??
        null;
    } else if (referenceType === "sales-order") {
      counterpartAccount = accounts?.cogsAccountId?._id ?? null;
    } else if (referenceType === "purchase-order") {
      counterpartAccount = accounts?.apPendingAccountId?._id ?? null;
    } else {
      return undefined;
    }
    if (!counterpartAccount) {
      await this.notifySoftFail(
        movementDoc,
        `missing 'inventoryAccounts' mapping for type ${type} (${referenceType})`,
      );
      return undefined;
    }

    // ---- [4] Currency is required by the JE schema ----
    const currencyId =
      accounts?.defaultCurrencyId?._id ?? accounts?.defaultCurrencyId ?? null;
    if (!currencyId) {
      await this.notifySoftFail(
        movementDoc,
        "missing defaultCurrencyId in inventoryAccounts settings",
      );
      return undefined;
    }

    // ---- [5] Pick an active general journal for the posting ----
    const boundJournalModel =
      this.connectionManager.bindModelToDb(journalModel);
    const journal = await boundJournalModel
      .findOne({ journalType: "general", active: true })
      .lean();
    if (!journal) {
      await this.notifySoftFail(movementDoc, "no active general journal");
      return undefined;
    }

    // ---- [6] Build the balanced double entry ----
    // Adds-stock flows debit Inventory and credit the counterpart;
    // removes-stock flows debit the counterpart and credit inventory.
    const stockSide = addsStock
      ? { accountId: inventoryAccount, debit: amount, credit: 0 }
      : { accountId: inventoryAccount, debit: 0, credit: amount };
    const counterpartSide = addsStock
      ? { accountId: counterpartAccount, debit: 0, credit: amount }
      : { accountId: counterpartAccount, debit: amount, credit: 0 };

    return await runTransaction<JournalEntryDocument>(undefined, async (s) => {
      const boundJournalEntryModel =
        this.connectionManager.bindModelToDb(journalEntryModel);
      const docs = await boundJournalEntryModel.create(
        [
          {
            journalId: journal._id,
            date: movementDoc?.date ?? new Date(),
            currencyId,
            status: JournalEntryStatus.POSTED,
            reference: movementDoc?.reference ?? undefined,
            sourceStockMovementId: movementDoc._id,
            lines: [
              {
                ...stockSide,
                description: addsStock ? "Stock in" : "Stock out",
                productId: movementDoc?.productId,
                quantity: movementDoc?.quantity,
              },
              {
                ...counterpartSide,
                description:
                  referenceType === "sales-order"
                    ? "Cost of sales"
                    : referenceType === "purchase-order"
                      ? "Goods received (pending AP)"
                      : "Stock adjustment",
                productId: movementDoc?.productId,
                quantity: movementDoc?.quantity,
              },
            ],
            active: true,
          },
        ],
        // session is not exposed by runTransaction's callback arg here —
        // create binds through s; use the transaction session for the model.
        { session: s },
      );
      return docs[0] as JournalEntryDocument;
    });
  }

  /**
   * Fires the standard soft-fail notification without throwing
   * @param movementDoc - The affected stock movement (for context)
   * @param message - Human-readable reason of the skip
   */
  private async notifySoftFail(
    movementDoc: any,
    message: string,
  ): Promise<void> {
    await fireNotification({
      type: "inventory.gl.mapping-missing",
      context: {},
      title: "GL posting skipped for stock movement",
      body: message?.slice(0, 240) ?? message,
      link: "/inventory/movements",
      module: "accounting",
    });
  }
}
