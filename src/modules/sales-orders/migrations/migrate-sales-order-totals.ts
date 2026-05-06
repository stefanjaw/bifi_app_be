import { salesOrderModel } from "../models/sales-order.model";

/**
 * One-time idempotent migration: backfill subtotal, taxTotal, grandTotal, and
 * taxes on Sales Orders that predate the tax-integration feature.
 *
 * For legacy orders without a grandTotal:
 *   subtotal  = amount  (what was historically stored as the line-item sum)
 *   taxes     = []
 *   taxTotal  = 0
 *   grandTotal = amount
 *
 * Re-running this migration is safe — orders with an existing grandTotal are
 * skipped.
 */
export async function migrateSalesOrderTotals(): Promise<void> {
  try {
    const coll = salesOrderModel.collection;

    const result = await coll.updateMany(
      { grandTotal: { $exists: false } },
      [
        {
          $set: {
            subtotal: "$amount",
            taxes: [],
            taxTotal: 0,
            grandTotal: "$amount",
          },
        },
      ],
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[migrate-sales-order-totals] Backfilled ${result.modifiedCount} sales order(s) with subtotal/taxTotal/grandTotal.`,
      );
    }
  } catch (error) {
    console.error(
      "[migrate-sales-order-totals] Failed to backfill sales order totals:",
      error,
    );
  }
}
