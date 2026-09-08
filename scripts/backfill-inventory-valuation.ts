/**
 * One-off backfill of valuation data for historical inventory records.
 *
 * What it does (per tenant database):
 * 1. Stamps every stock movement whose `unitCost` is absent with its product's current
 *    `costPrice`, and sets `totalCost = unitCost × quantity`.
 * 2. Sets `product.averageCost = costPrice` for products currently holding stock.
 * 3. Upserts the inventory settings singleton with `valuationMethod = WEIGHTED_AVERAGE`.
 *
 * ⚠️ Caveat: pre-feature movements are stamped at the product's CURRENT cost, not the
 * cost at transaction time. "As of" values before go-live are therefore approximate.
 *
 * Rerun-safety: only absent/null fields are stamped; records already carrying a cost
 * (including a recorded zero) are never modified, so the script is safe to rerun.
 *
 * Usage (from bifi_app_be):
 *   npx ts-node -r tsconfig-paths/register scripts/backfill-inventory-valuation.ts [--dry-run] [--db=<name> | --all]
 *   --dry-run  Report what would change without writing (default: apply changes)
 *   --db=X     Backfill a single tenant database by name
 *   --all      Backfill every database on the cluster containing inventory collections
 *              (requires listDatabases privileges; use --db when admin access is unavailable)
 */
import dotenv from "dotenv";
import mongoose, { PaginateModel } from "mongoose";
import { stockMovementModel } from "../src/modules/inventory/models/stock-movement.model";
import { stockBalanceModel } from "../src/modules/inventory/models/stock-balance.model";
import { productModel } from "../src/modules/inventory/models/product.model";
import {
  inventorySettingsModel,
  ValuationMethod,
} from "../src/modules/inventory/models/inventory-settings.model";
import type {
  InventoryProductDocument,
  StockMovementDocument,
  InventorySettingsDocument,
  StockBalanceDocument,
} from "../src/types/mongoose.gen";

dotenv.config();

/** Result counters for one tenant database */
interface DbBackfillResult {
  dbName: string;
  movementsStamped: number;
  movementsScanned: number;
  productsStamped: number;
  settingsAction: string;
}

/** Parsed CLI arguments */
interface ScriptArgs {
  dryRun: boolean;
  dbName?: string;
  all: boolean;
}

/** Databases reserved by MongoDB that must never be processed */
const SKIP_DBS = new Set(["admin", "local", "config"]);

/** Collections that identify a database containing inventory data */
const TRIGGER_COLLECTIONS = [
  "inventoryproducts",
  "stockmovements",
  "inventorysettings",
];

/** Canonical registered model names for the inventory models */
const MOVEMENT_MODEL = "StockMovement";
const PRODUCT_MODEL = "InventoryProduct";
const BALANCE_MODEL = "StockBalance";
const SETTINGS_MODEL = "InventorySettings";

/** Cache of tenant connections created during the run */
const dbCache = new Map<string, mongoose.Connection>();

/** Default tenant database used when neither the URI nor the CLI specifies one */
const DEFAULT_DB_NAME = "bifi_app_db";

/** Root schemas registered on each tenant connection, keyed by registered model name */
const rootSchemas: Record<string, mongoose.Schema> = {
  StockMovement: stockMovementModel.schema,
  InventoryProduct: productModel.schema,
  StockBalance: stockBalanceModel.schema,
  InventorySettings: inventorySettingsModel.schema,
};

/**
 * Parses command-line arguments.
 * @param argv - The raw process.argv slice.
 * @returns The parsed script arguments.
 * @throws {Error} On unknown or conflicting arguments.
 */
function parseArgs(argv: string[]): ScriptArgs {
  const args: ScriptArgs = { dryRun: false, all: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--all") {
      args.all = true;
    } else if (arg.startsWith("--db=")) {
      args.dbName = arg.slice("--db=".length);
    } else if (arg === "--db") {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        throw new Error("--db requires a database name");
      }
      args.dbName = next;
      index++;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (args.dbName && args.all) {
    throw new Error("--db and --all are mutually exclusive");
  }
  return args;
}

/**
 * Resolves a reference field (ObjectId or populated document) to its raw id string.
 * @param value - The value of a reference field.
 * @returns The id as a string.
 */
function resolveReferenceId(value: unknown): string {
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

/**
 * Extracts the default database name embedded in the connection URI, if any.
 * @param uri - The MongoDB connection URI.
 * @returns The default database name or undefined when the URI has none.
 */
function defaultDbNameFromUri(uri: string): string | undefined {
  const afterScheme = uri.includes("://") ? uri.split("://")[1] : uri;
  const pathPart = afterScheme?.split("/")[1];
  const dbName = pathPart?.split("?")[0];
  return dbName || undefined;
}

/**
 * Registers the inventory models on a tenant connection and returns that connection.
 * @param dbName - The tenant database name.
 * @returns The tenant mongoose connection with inventory models registered.
 */
function getTenantDb(dbName: string): mongoose.Connection {
  const existing = dbCache.get(dbName);
  if (existing) {
    return existing;
  }
  const db = mongoose.connection.useDb(dbName, { useCache: true });
  dbCache.set(dbName, db);
  Object.keys(rootSchemas).forEach((modelName) => {
    if (!db.models[modelName]) {
      db.model(modelName, rootSchemas[modelName]);
    }
  });
  return db;
}

/**
 * Discovers databases that contain at least one inventory collection.
 * @returns The list of candidate tenant database names.
 * @throws {Error} When listDatabases is not available.
 */
async function discoverTenants(): Promise<string[]> {
  const adminDb = mongoose.connection.db;
  if (!adminDb) {
    throw new Error("No connected root database");
  }
  const listings = await adminDb.admin().listDatabases();
  const names = listings.databases
    .map((entry) => entry.name)
    .filter((name) => !SKIP_DBS.has(name));

  const inventoryDbs: string[] = [];
  for (const name of names) {
    const db = getTenantDb(name);
    const collections = await db.listCollections();
    const collectionNames = new Set(collections.map((c) => c.name));
    if (TRIGGER_COLLECTIONS.some((c) => collectionNames.has(c))) {
      inventoryDbs.push(name);
    }
  }
  return inventoryDbs;
}

/**
 * Stamps missing unitCost/totalCost on movements using each product's current costPrice.
 * @param movements - The movement model bound to the tenant db.
 * @param products - The product model bound to the tenant db.
 * @param dryRun - When true, reports counts without writing.
 * @returns Scanned and stamped movement counts.
 */
async function backfillMovements(
  movements: PaginateModel<StockMovementDocument>,
  products: PaginateModel<InventoryProductDocument>,
  dryRun: boolean,
): Promise<{ scanned: number; stamped: number }> {
  const productDocs = (await products
    .find({}, { costPrice: 1 })
    .lean()) as unknown as Array<{ _id: unknown; costPrice?: number }>;
  const costByProductId = new Map<string, number>(
    productDocs.map((product) => [String(product._id), product.costPrice ?? 0]),
  );

  // Only absent/null unitCost are stamped — a recorded 0 cost is never rewritten
  const toStamp = (await movements
    .find({ unitCost: { $eq: null } })
    .lean()) as unknown as Array<{
    _id: unknown;
    productId: unknown;
    quantity?: number;
  }>;

  if (dryRun) {
    return { scanned: toStamp.length, stamped: 0 };
  }

  let stamped = 0;
  for (const movement of toStamp) {
    const productId = resolveReferenceId(movement.productId);
    const costPrice = costByProductId.get(productId) ?? 0;
    const quantity = movement.quantity ?? 0;
    await movements.updateOne(
      { _id: movement._id },
      {
        $set: {
          unitCost: costPrice,
          totalCost: Number((costPrice * quantity).toFixed(5)),
        },
      },
    );
    stamped++;
  }
  return { scanned: toStamp.length, stamped };
}

/**
 * Sets averageCost = costPrice on products that currently hold stock and never
 * had a valuation average recorded.
 * @param products - The product model bound to the tenant db.
 * @param balances - The stock balance model bound to the tenant db.
 * @param dryRun - When true, reports counts without writing.
 * @returns The number of products stamped.
 */
async function backfillAverageCost(
  products: PaginateModel<InventoryProductDocument>,
  balances: PaginateModel<StockBalanceDocument>,
  dryRun: boolean,
): Promise<number> {
  const stockProductIds = await balances.distinct("productId", {
    quantity: { $gt: 0 },
  });
  const productsToStamp = (await products
    .find(
      { averageCost: { $eq: null }, _id: { $in: stockProductIds } },
      { costPrice: 1 },
    )
    .lean()) as unknown as Array<{ _id: unknown; costPrice?: number }>;

  if (dryRun) {
    return productsToStamp.length;
  }

  for (const product of productsToStamp) {
    await products.updateOne(
      { _id: product._id },
      { $set: { averageCost: product.costPrice ?? 0 } },
    );
  }
  return productsToStamp.length;
}

/**
 * Upserts the inventory settings singleton with the weighted average valuation method.
 * @param settings - The settings model bound to the tenant db.
 * @param dryRun - When true, reports the action without writing.
 * @returns What happened to the settings document ("created" | "updated" | "skipped", with dry-run suffix).
 */
async function backfillSettings(
  settings: PaginateModel<InventorySettingsDocument>,
  dryRun: boolean,
): Promise<string> {
  const existing = await settings.findOne().lean();
  if (existing && (existing as unknown as Record<string, unknown>).valuationMethod) {
    return "skipped";
  }
  if (dryRun) {
    return existing ? "updated (dry-run)" : "created (dry-run)";
  }
  if (existing) {
    await settings.updateOne(
      { _id: (existing as unknown as { _id: unknown })._id },
      { $set: { valuationMethod: ValuationMethod.WEIGHTED_AVERAGE } },
    );
    return "updated";
  }
  await settings.create({ valuationMethod: ValuationMethod.WEIGHTED_AVERAGE });
  return "created";
}

/**
 * Backfills a single tenant database.
 * @param dbName - The tenant database name.
 * @param args - The parsed script arguments.
 * @returns The backfill result for the database.
 */
async function backfillDb(
  dbName: string,
  args: ScriptArgs,
): Promise<DbBackfillResult> {
  const db = getTenantDb(dbName);
  const movements = db.model(MOVEMENT_MODEL) as PaginateModel<StockMovementDocument>;
  const products = db.model(PRODUCT_MODEL) as PaginateModel<InventoryProductDocument>;
  const balances = db.model(BALANCE_MODEL) as PaginateModel<StockBalanceDocument>;
  const settings = db.model(SETTINGS_MODEL) as PaginateModel<InventorySettingsDocument>;

  const movementResult = await backfillMovements(movements, products, args.dryRun);
  const productsStamped = await backfillAverageCost(products, balances, args.dryRun);
  const settingsAction = await backfillSettings(settings, args.dryRun);

  return {
    dbName,
    movementsStamped: movementResult.stamped,
    movementsScanned: movementResult.scanned,
    productsStamped,
    settingsAction,
  };
}

/**
 * Entry point: connects, resolves target databases, and runs the backfill per database.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGO_DB_URL || "mongodb://localhost:27017/bifi_app_db";

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri, { timeoutMS: 5000 });
  console.log("Connected.");

  let tenantNames: string[];
  if (args.dbName) {
    tenantNames = [args.dbName];
  } else if (args.all) {
    tenantNames = await discoverTenants();
    console.log(`Discovered ${tenantNames.length} database(s) with inventory data.`);
  } else {
    const defaultDb =
      defaultDbNameFromUri(uri) ??
      mongoose.connection.db?.databaseName ??
      DEFAULT_DB_NAME;
    tenantNames = [defaultDb];
  }

  const results: DbBackfillResult[] = [];
  const failures: Array<{ dbName: string; message: string }> = [];

  for (const dbName of tenantNames) {
    try {
      const result = await backfillDb(dbName, args);
      results.push(result);
      console.log(
        `[${args.dryRun ? "DRY-RUN" : "APPLIED"}] ${result.dbName} | movements scanned: ${result.movementsScanned}, stamped: ${result.movementsStamped} | products averageCost: ${result.productsStamped} | settings: ${result.settingsAction}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ dbName, message });
      console.error(`[ERROR] ${dbName}: ${message}`);
      // Diagnostic: model registration state on root and tenant connections
      try {
        const rootModelNames = mongoose.connection.modelNames();
        const tenantModels = Object.keys(dbCache.get(dbName)?.models ?? {});
        console.error(
          `[DIAG] root models: ${rootModelNames.join(", ")} | tenant ${dbName} models: ${tenantModels.length ? tenantModels.join(", ") : "none"}`,
        );
      } catch {
        console.error("[DIAG] could not introspect model registration state");
      }
    }
  }

  console.log(
    `\nDone. mode=${args.dryRun ? "DRY-RUN" : "APPLY"} | dbs processed: ${results.length}/${tenantNames.length} | failures: ${failures.length}`,
  );

  await mongoose.disconnect();
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Backfill failed: ${message}`);
  await mongoose.disconnect();
  process.exit(1);
});
