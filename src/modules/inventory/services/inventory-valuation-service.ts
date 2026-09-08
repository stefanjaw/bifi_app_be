import mongoose, { ClientSession } from "mongoose";
import {
  BaseService,
  ValidationException,
  runTransaction,
} from "../../../system";
import {
  stockMovementModel,
  StockMovementDocument,
  MovementType,
  AdjustmentDirection,
} from "../models/stock-movement.model";
import { productModel } from "../models/product.model";

/** Rounds a cost value to 5 decimals to prevent floating-point drift across operations */
const roundCost = (value: number): number => Number(value.toFixed(5));

/** Valuation report mode: point-in-time (AS_OF) or period (DATE_RANGE) */
export type ValuationMode = "AS_OF" | "DATE_RANGE";

/** Query parameters accepted by the inventory valuation report endpoint */
export interface ValuationQuery {
  mode?: string;
  asOfDate?: string;
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  locationId?: string;
  productId?: string;
  productTypeId?: string;
}

/** Per-product valuation row of the report */
export interface ValuationRow {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
}

/** Point-in-time (AS_OF) valuation report */
export interface ValuationAsOfReport {
  mode: "AS_OF";
  asOfDate: Date;
  rows: ValuationRow[];
  totalValue: number;
}

/** Period (DATE_RANGE) valuation report */
export interface ValuationDateRangeReport {
  mode: "DATE_RANGE";
  fromDate: Date;
  toDate: Date;
  beginningValue: number;
  incomingValue: number;
  outgoingValue: number;
  adjustmentsValue: number;
  endingValue: number;
  rows: ValuationRow[];
}

/** Valuation report payload returned by the valuation endpoint */
export type ValuationReport = ValuationAsOfReport | ValuationDateRangeReport;

/** Internal per-product ledger replay state */
interface ReplayState {
  quantity: number;
  averageCost: number;
  name: string;
  sku: string;
}

/** Minimal shape of a movement document used by the replay engine (lean + autopopulated) */
interface ReplayMovement {
  productId: unknown;
  quantity?: number;
  type: MovementType;
  unitCost?: number;
  totalCost?: number;
  adjustmentDirection?: string | null;
  referenceType?: string | null;
  date?: Date;
}

/**
 * Historical inventory valuation engine. Reconstructs weighted average cost and stock
 * quantity for any historical date by replaying the stock movement ledger chronologically.
 * The replay applies the same weighted average formula as StockMovementService, so report
 * values match the product's running average. Legacy untagged TRANSFER legs are skipped
 * (value-neutral at product level).
 */
export class InventoryValuationService extends BaseService<StockMovementDocument> {
  constructor() {
    super({ model: stockMovementModel });
  }

  /**
   * Builds an inventory valuation report for a point in time or a date range.
   * @param query - Raw query parameters (mode is required; AS_OF needs asOfDate, DATE_RANGE needs fromDate/toDate).
   * @returns The valuation report (AS_OF rows + total, or DATE_RANGE totals + ending breakdown).
   * @throws {ValidationException} When mode/date parameters are missing, invalid, or inconsistent.
   */
  async getValuation(query: ValuationQuery): Promise<ValuationReport> {
    const filter = await this.buildMovementFilter(query);
    const mode = query.mode;

    if (mode === "AS_OF") {
      const asOfDate = this.endOfDay(
        this.parseDateOrThrow(query.asOfDate, "asOfDate"),
      );
      return await runTransaction<ValuationReport>(undefined, async (s) => {
        const { states } = await this.replayLedger(
          { ...filter, date: { $lte: asOfDate } },
          null,
          s,
        );
        await this.hydrateProductDetails(states, s);
        const rows = this.toRows(states);
        return {
          mode: "AS_OF",
          asOfDate,
          rows,
          totalValue: roundCost(this.sumValues(states)),
        };
      });
    }

    if (mode === "DATE_RANGE") {
      const fromParameter = this.parseDateOrThrow(query.fromDate, "fromDate");
      const toParameter = this.parseDateOrThrow(query.toDate, "toDate");
      if (toParameter < fromParameter) {
        throw new ValidationException(
          "fromDate must be before or equal to toDate.",
        );
      }
      const fromDate = this.startOfDay(fromParameter);
      const toDate = this.endOfDay(toParameter);
      const fromInstant = new Date(fromDate.getTime() - 1);

      return await runTransaction<ValuationReport>(undefined, async (s) => {
        const {
          states,
          beginningValue,
          incomingValue,
          outgoingValue,
          adjustmentsValue,
        } = await this.replayLedger(
          { ...filter, date: { $lte: toDate } },
          fromInstant,
          s,
        );
        await this.hydrateProductDetails(states, s);
        const rows = this.toRows(states);
        const endingValue = this.sumValues(states);
        return {
          mode: "DATE_RANGE",
          fromDate,
          toDate,
          beginningValue: roundCost(beginningValue),
          incomingValue: roundCost(incomingValue),
          outgoingValue: roundCost(outgoingValue),
          adjustmentsValue: roundCost(adjustmentsValue),
          endingValue: roundCost(endingValue),
          rows,
        };
      });
    }

    throw new ValidationException(
      "mode is required and must be AS_OF or DATE_RANGE.",
    );
  }

  /**
   * Validates optional reference filters and builds the base movement filter.
   * @param query - The raw valuation query.
   * @returns A MongoDB filter over optional warehouse/location/product dimensions.
   * @throws {ValidationException} When a provided reference id is not a valid ObjectId.
   */
  private async buildMovementFilter(
    query: ValuationQuery,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};

    if (query.productId) {
      this.validateReferenceId(query.productId, "productId");
      filter.productId = query.productId;
    }
    if (query.warehouseId) {
      this.validateReferenceId(query.warehouseId, "warehouseId");
      filter.warehouseId = query.warehouseId;
    }
    if (query.locationId) {
      this.validateReferenceId(query.locationId, "locationId");
      filter.locationId = query.locationId;
    }
    if (query.productTypeId) {
      this.validateReferenceId(query.productTypeId, "productTypeId");
      const boundProductModel =
        this.connectionManager.bindModelToDb(productModel);
      const products = await boundProductModel
        .find({ productTypeId: query.productTypeId }, { _id: 1 })
        .lean();
      filter.productId = {
        $in: products.map((product) =>
          this.resolveReferenceId((product as unknown as { _id: unknown })._id),
        ),
      };
    }

    return filter;
  }

  /**
   * Replays the filtered movement ledger chronologically, maintaining per-product
   * weighted average cost. When a boundary instant is provided, the value snapshot
   * just before the boundary is returned as beginningValue and in-range movements
   * are classified into incoming/outgoing/adjustment value sums.
   * @param filter - The movement filter (dimension + date bounds).
   * @param boundary - Optional instant that splits beginning from in-range movements.
   * @param session - The active client session.
   * @returns Per-product replay states and beginning/incoming/outgoing/adjustment value totals.
   */
  private async replayLedger(
    filter: Record<string, unknown>,
    boundary: Date | null,
    session: ClientSession,
  ): Promise<{
    states: Map<string, ReplayState>;
    beginningValue: number;
    incomingValue: number;
    outgoingValue: number;
    adjustmentsValue: number;
  }> {
    const boundMovementModel =
      this.connectionManager.bindModelToDb(stockMovementModel);

    const states = new Map<string, ReplayState>();
    let beginningValue = 0;
    let incomingValue = 0;
    let outgoingValue = 0;
    let adjustmentsValue = 0;
    let snapshotTaken = boundary === null;

    const cursor = boundMovementModel
      .find(filter, {
        productId: 1,
        quantity: 1,
        type: 1,
        unitCost: 1,
        totalCost: 1,
        adjustmentDirection: 1,
        referenceType: 1,
        date: 1,
      })
      .sort({ date: 1, createdAt: 1 })
      .session(session)
      .lean();

    for await (const raw of cursor) {
      const movement = raw as unknown as ReplayMovement;
      const movementDate = movement.date ? new Date(movement.date) : new Date();

      if (boundary !== null && !snapshotTaken && movementDate >= boundary) {
        beginningValue = this.sumValues(states);
        snapshotTaken = true;
      }

      const quantity = movement.quantity ?? 0;
      const unitCost = roundCost(movement.unitCost ?? 0);
      const sign = this.movementSign(movement);

      if (snapshotTaken) {
        const cost = movement.totalCost ?? unitCost * quantity;
        if (movement.type === MovementType.IN) {
          incomingValue += cost;
        } else if (movement.type === MovementType.OUT) {
          outgoingValue += cost;
        } else if (movement.type === MovementType.ADJUSTMENT) {
          adjustmentsValue +=
            movement.adjustmentDirection === AdjustmentDirection.DECREASE
              ? -cost
              : cost;
        } else if (movement.type === MovementType.TRANSFER) {
          if (movement.referenceType === "transfer-in") {
            incomingValue += cost;
          } else if (movement.referenceType === "transfer-out") {
            outgoingValue += cost;
          }
        }
      }

      if (sign === 0 || quantity <= 0) {
        continue;
      }

      const key = this.resolveReferenceId(movement.productId);
      const state = this.ensureState(states, key, movement);

      if (sign > 0) {
        const totalQuantity = state.quantity + quantity;
        state.averageCost =
          totalQuantity > 0
            ? roundCost(
                (state.quantity * state.averageCost + quantity * unitCost) /
                  totalQuantity,
              )
            : 0;
        state.quantity += quantity;
      } else {
        state.quantity -= quantity;
      }
    }

    if (boundary !== null && !snapshotTaken) {
      beginningValue = this.sumValues(states);
    }

    return {
      states,
      beginningValue,
      incomingValue,
      outgoingValue,
      adjustmentsValue,
    };
  }

  /**
   * Determines the signed effect of a movement on product-level stock.
   * Legacy untagged TRANSFER legs are skipped (sign 0) because their direction
   * cannot be certified from the record alone.
   * @param movement - The lean movement document.
   * @returns 1 for stock-in effects, -1 for stock-out effects, 0 for skipped movements.
   */
  private movementSign(movement: ReplayMovement): number {
    switch (movement.type) {
      case MovementType.IN:
        return 1;
      case MovementType.OUT:
        return -1;
      case MovementType.ADJUSTMENT:
        return movement.adjustmentDirection === AdjustmentDirection.DECREASE
          ? -1
          : 1;
      case MovementType.TRANSFER:
        if (movement.referenceType === "transfer-in") {
          return 1;
        }
        return movement.referenceType === "transfer-out" ? -1 : 0;
      default:
        return 0;
    }
  }

  /**
   * Gets or creates the replay state for a product, capturing the autopopulated
   * product name/sku from the first movement seen for that product.
   * @param states - The map of per-product replay states.
   * @param productId - The product id key.
   * @param movement - The movement carrying the autopopulated product reference.
   * @returns The replay state for the product.
   */
  private ensureState(
    states: Map<string, ReplayState>,
    productId: string,
    movement: ReplayMovement,
  ): ReplayState {
    const existing = states.get(productId);
    if (existing) {
      return existing;
    }
    const populated =
      typeof movement.productId === "object" && movement.productId !== null
        ? (movement.productId as { name?: unknown; sku?: unknown })
        : null;
    const created: ReplayState = {
      quantity: 0,
      averageCost: 0,
      name: populated ? String(populated.name ?? "") : "",
      sku: populated ? String(populated.sku ?? "") : "",
    };
    states.set(productId, created);
    return created;
  }

  /**
   * Fills product name/sku on replay states with a single bulk product lookup.
   * Autopopulation is not guaranteed on the projected lean replay cursor, so the
   * product documents are fetched explicitly before building report rows.
   * @param states - The per-product replay states to hydrate.
   * @param session - The active client session.
   */
  private async hydrateProductDetails(
    states: Map<string, ReplayState>,
    session: ClientSession,
  ): Promise<void> {
    const missingIds = Array.from(states.keys()).filter((productId) => {
      const state = states.get(productId) as ReplayState;
      return (
        (!state.name || !state.sku) &&
        mongoose.Types.ObjectId.isValid(productId)
      );
    });
    if (missingIds.length === 0) {
      return;
    }
    const boundProductModel =
      this.connectionManager.bindModelToDb(productModel);
    const productDocs = (await boundProductModel
      .find({ _id: { $in: missingIds } }, { name: 1, sku: 1 })
      .session(session)
      .lean()) as unknown as Array<{
      _id: unknown;
      name?: string | null;
      sku?: string | null;
    }>;
    for (const product of productDocs) {
      const state = states.get(String(product._id));
      if (state) {
        state.name = product.name ? String(product.name) : state.name;
        state.sku = product.sku ? String(product.sku) : state.sku;
      }
    }
  }

  /**
   * Converts replay states to report rows sorted by product name.
   * @param states - The per-product replay states (with autopopulated name/sku when available).
   * @returns The valuation rows.
   */
  private toRows(states: Map<string, ReplayState>): ValuationRow[] {
    return Array.from(states.entries())
      .map(([productId, state]) => ({
        productId,
        name: state.name,
        sku: state.sku,
        quantity: roundCost(state.quantity),
        unitCost: state.averageCost,
        totalValue: roundCost(state.quantity * state.averageCost),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Sums the current inventory value (quantity × average cost) across replay states.
   * @param states - The per-product replay states.
   * @returns The total value.
   */
  private sumValues(states: Map<string, ReplayState>): number {
    let total = 0;
    for (const state of states.values()) {
      total += state.quantity * state.averageCost;
    }
    return total;
  }

  /**
   * Parses a query date string, rejecting invalid values.
   * @param value - The raw date string.
   * @param field - The query field name (for the error message).
   * @returns The parsed date.
   * @throws {ValidationException} When the value is missing or not a valid date.
   */
  private parseDateOrThrow(value: string | undefined, field: string): Date {
    if (!value) {
      throw new ValidationException(`${field} is required.`);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationException(`${field} is not a valid date: ${value}.`);
    }
    return parsed;
  }

  /**
   * Normalizes a date to the start of its day.
   * @param date - The input date.
   * @returns The same day at 00:00:00.000.
   */
  private startOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Normalizes a date to the end of its day.
   * @param date - The input date.
   * @returns The same day at 23:59:59.999.
   */
  private endOfDay(date: Date): Date {
    const normalized = this.startOfDay(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  }

  /**
   * Validates an optional reference id filter value.
   * @param value - The raw id string.
   * @param field - The field name (for the error message).
   * @throws {ValidationException} When the value is not a valid ObjectId.
   */
  private validateReferenceId(value: string, field: string): void {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new ValidationException(`${field} is not a valid id: ${value}.`);
    }
  }

  /**
   * Resolves a reference field (ObjectId or populated document) to its raw id string.
   * @param value - The value of a reference field.
   * @returns The id as a string.
   */
  private resolveReferenceId(value: unknown): string {
    if (typeof value === "object" && value !== null && "_id" in value) {
      return String((value as { _id: unknown })._id);
    }
    return String(value);
  }
}
