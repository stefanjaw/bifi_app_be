import {
  BaseService,
  ValidationException,
  NotFoundException,
  runTransaction,
} from "../../../system";
import {
  stockMovementModel,
  StockMovementDocument,
  MovementType,
  AdjustmentDirection,
} from "../models/stock-movement.model";
import { stockBalanceModel } from "../models/stock-balance.model";
import { productModel, ProductDocument } from "../models/product.model";
import {
  StockMovementDTO,
  TransferDTO,
  ReversalDTO,
} from "../models/stock-movement.dto";
import { ClientSession } from "mongoose";

/** Rounds a cost value to 5 decimals to prevent floating-point drift across operations */
const roundCost = (value: number): number => Number(value.toFixed(5));

/** Business logic service for stock movement and transfer operations with weighted average cost valuation */
export class StockMovementService extends BaseService<StockMovementDocument> {
  constructor() {
    super({ model: stockMovementModel });
  }

  /**
   * Creates a stock movement, updates the stock balance atomically, and maintains the
   * product's weighted average cost. TRANSFER movements must use the transfer endpoint.
   * Weighted average is updated on IN and ADJUSTMENT/INCREASE; OUT and ADJUSTMENT/DECREASE
   * consume inventory at the current weighted average without moving it.
   * @param data - The movement data (unitCost is resolved server-side when omitted).
   * @param session - The optional client session to reuse inside an existing transaction.
   * @returns The created movement document.
   * @throws {ValidationException} On TRANSFER via create, invalid type/direction combination, or insufficient stock.
   */
  override async create(
    data: StockMovementDTO,
    session?: ClientSession,
  ): Promise<StockMovementDocument> {
    return await runTransaction(
      session,
      async (s): Promise<StockMovementDocument> => {
        const { productId, warehouseId, locationId, quantity, type } = data;
        const boundBalanceModel =
          this.connectionManager.bindModelToDb(stockBalanceModel);

        if (type === MovementType.TRANSFER) {
          throw new ValidationException(
            "Use the transfer endpoint for TRANSFER movements.",
          );
        }

        if (type === MovementType.ADJUSTMENT && !data.adjustmentDirection) {
          throw new ValidationException(
            "adjustmentDirection is required for ADJUSTMENT movements.",
          );
        }
        if (type !== MovementType.ADJUSTMENT && data.adjustmentDirection) {
          throw new ValidationException(
            "adjustmentDirection is only allowed for ADJUSTMENT movements.",
          );
        }

        const { product, currentQuantity, currentAverageCost } =
          await this.getValuationContext(productId, s);

        const isIncrease =
          type === MovementType.IN ||
          (type === MovementType.ADJUSTMENT &&
            data.adjustmentDirection === AdjustmentDirection.INCREASE);

        const boundProductModel =
          this.connectionManager.bindModelToDb(productModel);

        if (isIncrease) {
          const unitCost = roundCost(data.unitCost ?? product.costPrice ?? 0);

          await boundBalanceModel.findOneAndUpdate(
            { productId, locationId, warehouseId },
            { $inc: { quantity } },
            { upsert: true, new: true, session: s, setDefaultsOnInsert: true },
          );

          const totalQuantity = currentQuantity + quantity;
          const newAverageCost =
            totalQuantity > 0
              ? roundCost(
                  (currentQuantity * currentAverageCost + quantity * unitCost) /
                    totalQuantity,
                )
              : unitCost;
          await boundProductModel.updateOne(
            { _id: productId },
            { averageCost: newAverageCost },
            { session: s },
          );

          const totalCost = roundCost(unitCost * quantity);
          return await super.create({ ...data, unitCost, totalCost }, s);
        }

        const unitCost = roundCost(currentAverageCost);

        const balance = await boundBalanceModel
          .findOne({ productId, locationId, warehouseId })
          .session(s);

        if (!balance || (balance.quantity ?? 0) < quantity) {
          throw new ValidationException(
            `Insufficient stock at this location. Available: ${
              balance?.quantity ?? 0
            }, requested: ${quantity}`,
          );
        }

        await boundBalanceModel.findOneAndUpdate(
          { productId, locationId, warehouseId },
          { $inc: { quantity: -quantity } },
          { new: true, session: s },
        );

        const totalCost = roundCost(unitCost * quantity);
        return await super.create({ ...data, unitCost, totalCost }, s);
      },
    );
  }

  /**
   * Transfers stock between two locations atomically. Both transfer legs record the
   * current weighted average cost, keeping product-level value unchanged.
   * @param data - The transfer payload (source and destination warehouse/location).
   * @param session - The optional client session to reuse inside an existing transaction.
   * @returns The OUT-side and IN-side transfer movement documents.
   * @throws {ValidationException} When source and destination are the same or stock is insufficient.
   */
  async transfer(
    data: TransferDTO,
    session?: ClientSession,
  ): Promise<{
    outMovement: StockMovementDocument;
    inMovement: StockMovementDocument;
  }> {
    return await runTransaction(session, async (s) => {
      const {
        productId,
        fromWarehouseId,
        fromLocationId,
        toWarehouseId,
        toLocationId,
        quantity,
        reference,
        notes,
      } = data;
      const boundBalanceModel =
        this.connectionManager.bindModelToDb(stockBalanceModel);

      if (fromLocationId === toLocationId) {
        throw new ValidationException(
          "Source and destination locations must be different.",
        );
      }

      const sourceBalance = await boundBalanceModel
        .findOne({
          productId,
          locationId: fromLocationId,
          warehouseId: fromWarehouseId,
        })
        .session(s);

      if (!sourceBalance || (sourceBalance.quantity ?? 0) < quantity) {
        throw new ValidationException(
          `Insufficient stock at source location. Available: ${
            sourceBalance?.quantity ?? 0
          }, requested: ${quantity}`,
        );
      }

      const { currentAverageCost } = await this.getValuationContext(
        productId,
        s,
      );
      const unitCost = roundCost(currentAverageCost);
      const totalCost = roundCost(unitCost * quantity);

      await boundBalanceModel.findOneAndUpdate(
        { productId, locationId: fromLocationId, warehouseId: fromWarehouseId },
        { $inc: { quantity: -quantity } },
        { new: true, session: s },
      );

      await boundBalanceModel.findOneAndUpdate(
        { productId, locationId: toLocationId, warehouseId: toWarehouseId },
        { $inc: { quantity } },
        { upsert: true, new: true, session: s, setDefaultsOnInsert: true },
      );

      const now = new Date();

      const outMovement = await super.create(
        {
          productId,
          warehouseId: fromWarehouseId,
          locationId: fromLocationId,
          quantity,
          unitCost,
          totalCost,
          type: MovementType.TRANSFER,
          reference: reference ?? "",
          referenceType: "transfer-out",
          notes: notes ?? "",
          date: now,
        },
        s,
      );

      const inMovement = await super.create(
        {
          productId,
          warehouseId: toWarehouseId,
          locationId: toLocationId,
          quantity,
          unitCost,
          totalCost,
          type: MovementType.TRANSFER,
          reference: reference ?? "",
          referenceType: "transfer-in",
          notes: notes ?? "",
          date: now,
        },
        s,
      );

      return { outMovement, inMovement };
    });
  }

  /**
   * Reverses a posted stock movement by creating an opposing movement linked via
   * reversalOf, restoring/withdrawing stock and recomputing the weighted average
   * symmetrically. Historical movements are never edited or deleted.
   * @param movementId - The ID of the movement to reverse.
   * @param data - Optional reversal data (custom note).
   * @param session - The optional client session to reuse inside an existing transaction.
   * @returns The original and reversal movement documents.
   * @throws {ValidationException} When the movement does not exist, is already reversed, is itself a reversal, or is a TRANSFER.
   */
  async reverse(
    movementId: string,
    data: ReversalDTO,
    session?: ClientSession,
  ): Promise<{
    originalMovement: StockMovementDocument;
    reversalMovement: StockMovementDocument;
  }> {
    return await runTransaction(session, async (s) => {
      const boundMovementModel =
        this.connectionManager.bindModelToDb(stockMovementModel);
      const boundBalanceModel =
        this.connectionManager.bindModelToDb(stockBalanceModel);
      const boundProductModel =
        this.connectionManager.bindModelToDb(productModel);

      const original = await boundMovementModel.findById(movementId).session(s);
      if (!original) {
        throw new NotFoundException(`Stock movement not found: ${movementId}.`);
      }
      if (original.reversalOf) {
        throw new ValidationException("Reversal movements cannot be reversed.");
      }
      const existingReversal = await boundMovementModel
        .findOne({ reversalOf: original._id })
        .session(s);
      if (existingReversal) {
        throw new ValidationException(
          "This movement has already been reversed.",
        );
      }
      if (original.type === MovementType.TRANSFER) {
        throw new ValidationException(
          "Transfers cannot be reversed. Create the opposite transfer instead.",
        );
      }

      const productId = this.resolveReferenceId(original.productId);
      const warehouseId = this.resolveReferenceId(original.warehouseId);
      const locationId = this.resolveReferenceId(original.locationId);
      const quantity = original.quantity;
      const type = original.type;
      const originalUnitCost = roundCost(original.unitCost ?? 0);

      const { currentQuantity, currentAverageCost } =
        await this.getValuationContext(productId, s);

      /** Whether the original movement added stock (IN or ADJUSTMENT/INCREASE); its reversal removes it */
      const originalAddsStock =
        type === MovementType.IN ||
        (type === MovementType.ADJUSTMENT &&
          original.adjustmentDirection === AdjustmentDirection.INCREASE);

      let oppositeType: MovementType;
      let oppositeDirection: AdjustmentDirection | undefined;

      if (originalAddsStock) {
        const balance = await boundBalanceModel
          .findOne({ productId, locationId, warehouseId })
          .session(s);
        if (!balance || (balance.quantity ?? 0) < quantity) {
          throw new ValidationException(
            `Insufficient stock at this location to reverse. Available: ${
              balance?.quantity ?? 0
            }, required: ${quantity}`,
          );
        }
        await boundBalanceModel.findOneAndUpdate(
          { productId, locationId, warehouseId },
          { $inc: { quantity: -quantity } },
          { new: true, session: s },
        );

        const remainingQuantity = currentQuantity - quantity;
        const newAverageCost =
          remainingQuantity > 0
            ? roundCost(
                Math.max(
                  0,
                  (currentQuantity * currentAverageCost -
                    quantity * originalUnitCost) /
                    remainingQuantity,
                ),
              )
            : 0;
        await boundProductModel.updateOne(
          { _id: productId },
          { averageCost: newAverageCost },
          { session: s },
        );

        oppositeType = MovementType.OUT;
        oppositeDirection =
          type === MovementType.ADJUSTMENT
            ? AdjustmentDirection.DECREASE
            : undefined;
      } else {
        await boundBalanceModel.findOneAndUpdate(
          { productId, locationId, warehouseId },
          { $inc: { quantity } },
          { upsert: true, new: true, session: s, setDefaultsOnInsert: true },
        );

        const totalQuantity = currentQuantity + quantity;
        const newAverageCost = roundCost(
          (currentQuantity * currentAverageCost + quantity * originalUnitCost) /
            totalQuantity,
        );
        await boundProductModel.updateOne(
          { _id: productId },
          { averageCost: newAverageCost },
          { session: s },
        );

        oppositeType = MovementType.IN;
        oppositeDirection =
          type === MovementType.ADJUSTMENT
            ? AdjustmentDirection.INCREASE
            : undefined;
      }

      const reversalMovement = await super.create(
        {
          productId,
          warehouseId,
          locationId,
          quantity,
          unitCost: originalUnitCost,
          totalCost: roundCost(originalUnitCost * quantity),
          type: oppositeType,
          ...(oppositeDirection
            ? { adjustmentDirection: oppositeDirection }
            : {}),
          reversalOf: original._id,
          reference: original.reference,
          referenceType: original.referenceType,
          notes: data?.notes ?? `Reversal of movement ${movementId}.`,
          date: new Date(),
        },
        s,
      );

      return { originalMovement: original, reversalMovement };
    });
  }

  /**
   * Imports stock movements from CSV, routing every row through create() so
   * stock balances and the weighted average cost stay consistent.
   * @param data - The rows parsed from the CSV file.
   * @param session - The optional client session to reuse inside an existing transaction.
   * @returns The created movement documents.
   * @throws {ValidationException} When any row is invalid or has insufficient stock.
   */
  override async importCSV(
    data: StockMovementDTO[],
    session?: ClientSession,
  ): Promise<StockMovementDocument[]> {
    return await runTransaction(session, async (s) => {
      const results: StockMovementDocument[] = [];
      for (const row of data) {
        results.push(await this.create(row, s));
      }
      return results;
    });
  }

  /**
   * Resolves the product-level valuation context (current quantity and weighted average)
   * inside the current transaction.
   * @param productId - The ID of the product to valuate.
   * @param session - The active client session.
   * @returns The product document, its total on-hand quantity, and the applicable weighted average cost.
   * @throws {ValidationException} When the product does not exist.
   */
  private async getValuationContext(
    productId: string,
    session: ClientSession,
  ): Promise<{
    product: ProductDocument;
    currentQuantity: number;
    currentAverageCost: number;
  }> {
    const boundProductModel =
      this.connectionManager.bindModelToDb(productModel);
    const boundBalanceModel =
      this.connectionManager.bindModelToDb(stockBalanceModel);

    const product = await boundProductModel
      .findById(productId)
      .session(session);
    if (!product) {
      throw new ValidationException(`Product not found: ${productId}.`);
    }

    const balances = await boundBalanceModel
      .find({ productId }, { quantity: 1 })
      .session(session)
      .lean();
    const currentQuantity = balances.reduce(
      (total, balance) => total + (balance.quantity ?? 0),
      0,
    );

    const averageCost = product.averageCost ?? 0;
    const currentAverageCost =
      averageCost > 0 ? averageCost : (product.costPrice ?? 0);

    return { product, currentQuantity, currentAverageCost };
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
