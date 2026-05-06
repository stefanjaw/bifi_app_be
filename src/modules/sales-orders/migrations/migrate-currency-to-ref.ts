import mongoose from "mongoose";
import { salesOrderModel } from "../models/sales-order.model";
import { currencyModel } from "../../currency/models/currency.model";

/**
 * One-time migration: convert any SalesOrder whose `currency` is still a
 * string ISO code (legacy data) into an ObjectId reference into the Currency
 * collection. Idempotent: skips orders already storing an ObjectId.
 *
 * Orders whose code can't be matched fall back to the default Currency
 * (`isDefault: true`) and are logged so the data can be inspected later.
 */
export async function migrateSalesOrderCurrencyToRef(): Promise<void> {
  try {
    // Use the raw collection to bypass schema casting (legacy docs hold
    // strings where the new schema expects ObjectIds).
    const coll = salesOrderModel.collection;

    const legacyCursor = coll.find({ currency: { $type: "string" } });
    const legacyDocs = await legacyCursor.toArray();

    if (legacyDocs.length === 0) {
      return;
    }

    console.log(
      `[migrate-currency] Found ${legacyDocs.length} sales order(s) with legacy string currency. Migrating...`,
    );

    const currencies = await currencyModel.find().lean();
    const codeMap = new Map<string, mongoose.Types.ObjectId>();
    let defaultCurrencyId: mongoose.Types.ObjectId | undefined;

    for (const c of currencies) {
      if (c.code) codeMap.set(String(c.code).toUpperCase(), c._id as mongoose.Types.ObjectId);
      if ((c as any).isDefault) defaultCurrencyId = c._id as mongoose.Types.ObjectId;
    }

    let migrated = 0;
    let fallback = 0;
    let skipped = 0;

    for (const doc of legacyDocs) {
      const legacyCode = String(doc.currency || "").toUpperCase();
      const targetId = codeMap.get(legacyCode) ?? defaultCurrencyId;

      if (!targetId) {
        console.warn(
          `[migrate-currency] No matching currency for code "${legacyCode}" and no default currency configured. Skipping order ${doc._id}.`,
        );
        skipped++;
        continue;
      }

      await coll.updateOne(
        { _id: doc._id },
        { $set: { currency: targetId } },
      );

      if (codeMap.has(legacyCode)) {
        migrated++;
      } else {
        fallback++;
        console.warn(
          `[migrate-currency] Order ${doc._id} had unknown currency code "${legacyCode}". Reassigned to default currency ${targetId}.`,
        );
      }
    }

    console.log(
      `[migrate-currency] Done. Migrated: ${migrated}, fallback-to-default: ${fallback}, skipped: ${skipped}.`,
    );
  } catch (error) {
    console.error(
      "[migrate-currency] Failed to migrate sales order currencies:",
      error,
    );
  }
}
