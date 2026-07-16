import {
  BaseService,
  ValidationException,
  runTransaction,
} from "../../../system";
import {
  stockMovementModel,
  StockMovementDocument,
  MovementType,
} from "../models/stock-movement.model";
import { stockBalanceModel } from "../models/stock-balance.model";
import { StockMovementDTO, TransferDTO } from "../models/stock-movement.dto";
import { ClientSession } from "mongoose";

/** Business logic service for stock movement and transfer operations */
export class StockMovementService extends BaseService<StockMovementDocument> {
  constructor() {
    super({ model: stockMovementModel });
  }

  override async create(
    data: StockMovementDTO,
    session?: ClientSession,
  ): Promise<StockMovementDocument> {
    return await runTransaction(session, async (s) => {
      const { productId, warehouseId, locationId, quantity, type } = data;
      const balanceModel =
        this.connectionManager.bindModelToDb(stockBalanceModel);

      if (type === MovementType.TRANSFER) {
        throw new ValidationException(
          "Use the transfer endpoint for TRANSFER movements.",
        );
      }

      if (type === MovementType.IN || type === MovementType.ADJUSTMENT) {
        await balanceModel.findOneAndUpdate(
          { productId, locationId, warehouseId },
          { $inc: { quantity } },
          { upsert: true, new: true, session: s, setDefaultsOnInsert: true },
        );
      } else if (type === MovementType.OUT) {
        const balance = await balanceModel
          .findOne({ productId, locationId, warehouseId })
          .session(s);

        if (!balance || (balance.quantity ?? 0) < quantity) {
          throw new ValidationException(
            `Insufficient stock at this location. Available: ${
              balance?.quantity ?? 0
            }, requested: ${quantity}`,
          );
        }

        await balanceModel.findOneAndUpdate(
          { productId, locationId, warehouseId },
          { $inc: { quantity: -quantity } },
          { new: true, session: s },
        );
      }

      return await super.create(data as any, s);
    });
  }

  async transfer(data: TransferDTO, session?: ClientSession) {
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
      const balanceModel =
        this.connectionManager.bindModelToDb(stockBalanceModel);

      if (fromLocationId === toLocationId) {
        throw new ValidationException(
          "Source and destination locations must be different.",
        );
      }

      const sourceBalance = await balanceModel
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

      await balanceModel.findOneAndUpdate(
        { productId, locationId: fromLocationId, warehouseId: fromWarehouseId },
        { $inc: { quantity: -quantity } },
        { new: true, session: s },
      );

      await balanceModel.findOneAndUpdate(
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
          type: MovementType.TRANSFER,
          reference: reference ?? "",
          notes: notes ?? "",
          date: now,
        } as any,
        s,
      );

      const inMovement = await super.create(
        {
          productId,
          warehouseId: toWarehouseId,
          locationId: toLocationId,
          quantity,
          type: MovementType.TRANSFER,
          reference: reference ?? "",
          notes: notes ?? "",
          date: now,
        } as any,
        s,
      );

      return { outMovement, inMovement };
    });
  }
}
