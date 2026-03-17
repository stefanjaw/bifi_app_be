import { catalogCacheModel } from "./models/catalog-cache.model";
import { freightCacheModel } from "./models/freight-cache.model";

export async function initializePricingIndexModels(): Promise<void> {
  try {
    await catalogCacheModel.syncIndexes();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Pricing index: catalog syncIndexes warning: ${msg}`);
  }

  try {
    await freightCacheModel.syncIndexes();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Pricing index: freight syncIndexes warning: ${msg}`);
  }
}
