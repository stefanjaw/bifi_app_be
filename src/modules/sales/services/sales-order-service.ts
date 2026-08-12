import { ClientSession, Types } from "mongoose";
import {
  BaseService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { salesOrderModel } from "../models/sales-order.model";
import { stockBalanceModel } from "../../inventory/models/stock-balance.model";
import {
  stockMovementModel,
  MovementType,
} from "../../inventory/models/stock-movement.model";
import { SalesSettingsService } from "./sales-settings-service";
import { SequenceService } from "../../sequences/services/sequence-service";
import { CurrencyService } from "../../currency/services/currency-service";
import { taxModel, TaxType } from "../../accounting/models/tax.model";
import { discountModel } from "../../accounting/models/discount.model";
import {
  calculateSubtotal,
  calculateTaxesPerLine,
  calculateGrandTotal,
  calculateLineItemTotal,
  TaxInput,
} from "../../../system/libraries/orders/price-calculator";

const salesSettingsService = new SalesSettingsService();
const sequenceService = new SequenceService();
const currencyService = new CurrencyService();

interface NormalizedLineItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxIds: string[];
  discountPercent?: number;
}

export class SalesOrderService extends BaseService<SalesOrderDocument> {
  constructor() {
    super({ model: salesOrderModel });
  }

  /**
   * Collects all unique taxIds from every line item, fetches them in a single
   * query, validates that each is active and of type SALES, and returns a
   * Map<taxId, TaxInput> for use in recomputeTotals.
   */
  private async assertLineTaxesValid(
    lineItems: { taxIds?: string[] }[],
    session: ClientSession | undefined,
  ): Promise<Map<string, TaxInput>> {
    const allIds = new Set<string>();
    for (const item of lineItems) {
      for (const id of item.taxIds ?? []) {
        if (!Types.ObjectId.isValid(id)) {
          throw new ValidationException(`Invalid taxId: ${id}`);
        }
        allIds.add(id);
      }
    }

    if (allIds.size === 0) return new Map();

    const boundTaxModel = this.connectionManager.bindModelToDb(taxModel);
    const foundTaxes = await boundTaxModel
      .find({ _id: { $in: [...allIds] } })
      .lean()
      .session(session as any);

    if (foundTaxes.length !== allIds.size) {
      const foundIds = new Set(foundTaxes.map((t: any) => t._id.toString()));
      const missing = [...allIds].find((id) => !foundIds.has(id));
      throw new ValidationException(`Tax not found: ${missing}`);
    }

    const taxMap = new Map<string, TaxInput>();
    for (const tax of foundTaxes as any[]) {
      if (!tax.active) {
        throw new ValidationException(`Tax "${tax.name}" is inactive`);
      }
      if (tax.taxType !== TaxType.SALES) {
        throw new ValidationException(
          `Tax "${tax.name}" is not a sales tax (taxType: ${tax.taxType})`,
        );
      }
      taxMap.set(tax._id.toString(), {
        _id: tax._id.toString(),
        percentage: tax.percentage,
      });
    }

    return taxMap;
  }

  /**
   * Recalculates each line item's `total` and the order-level
   * subtotal, taxTotal, grandTotal, and amount using per-line taxIds.
   * The frontend MUST NOT be trusted to provide these computed values.
   */
  private async recomputeTotals(
    data: Record<string, any>,
    taxDocsMap: Map<string, TaxInput>,
    session?: ClientSession,
  ): Promise<void> {
    const rawItems: any[] = Array.isArray(data.lineItems) ? data.lineItems : [];

    const discountIds = new Set<string>();
    for (const item of rawItems) {
      const did = item.discountId;
      if (did && typeof did === "string") discountIds.add(did);
    }

    const discountMap = new Map<string, number>();
    if (discountIds.size > 0) {
      const boundDiscountModel =
        this.connectionManager.bindModelToDb(discountModel);
      const discounts = await boundDiscountModel
        .find({ _id: { $in: [...discountIds] } })
        .lean()
        .session(session as any);
      for (const d of discounts as any[]) {
        if (d.discountType === "percentage") {
          discountMap.set(d._id.toString(), d.value);
        }
      }
    }

    const lineItems: NormalizedLineItem[] = rawItems.map((item: any) => {
      const quantity = Number(item?.quantity ?? 0);
      const unitPrice = Number(item?.unitPrice ?? 0);
      const discountId =
        typeof item.discountId === "string"
          ? item.discountId
          : item.discountId?._id;
      const discountPercent = discountId
        ? discountMap.get(discountId?.toString())
        : undefined;
      return {
        ...item,
        quantity,
        unitPrice,
        total: calculateLineItemTotal(quantity, unitPrice, discountPercent),
        taxIds: Array.isArray(item.taxIds) ? item.taxIds : [],
        discountPercent,
      };
    });

    if (Array.isArray(data.lineItems)) {
      data.lineItems = lineItems;
    }

    const subtotal = calculateSubtotal(lineItems);
    const { taxTotal, appliedTaxes } = calculateTaxesPerLine(
      lineItems,
      taxDocsMap,
    );
    const grandTotal = calculateGrandTotal(subtotal, taxTotal);

    data.subtotal = subtotal;
    data.taxTotal = taxTotal;
    data.grandTotal = grandTotal;
    data.amount = grandTotal;
    data.taxes = appliedTaxes;
  }

  /**
   * Validates that the provided currency id refers to an existing Currency
   * document. Throws a 400-style error otherwise.
   */
  private async assertCurrencyExists(currencyId: any): Promise<void> {
    if (!currencyId) return;
    const id =
      typeof currencyId === "object" && currencyId?._id
        ? currencyId._id.toString()
        : currencyId.toString();

    if (!Types.ObjectId.isValid(id)) {
      throw new ValidationException("Invalid currency reference");
    }

    const found = await currencyService.getById(id, undefined);
    if (!found) {
      throw new ValidationException("Invalid currency reference");
    }
  }

  override async create(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<SalesOrderDocument> {
    await this.assertCurrencyExists(data.currency);

    const rawLineItems: { taxIds?: string[] }[] = Array.isArray(data.lineItems)
      ? data.lineItems
      : [];
    const taxDocsMap = await this.assertLineTaxesValid(rawLineItems, session);

    await this.recomputeTotals(data, taxDocsMap, session);

    const settings = await salesSettingsService.getSettings();
    const orderSequence = settings?.orderSequence as any;
    if (orderSequence) {
      const seqId =
        typeof orderSequence === "object"
          ? orderSequence._id.toString()
          : orderSequence.toString();
      data.number = await sequenceService.getNextNumberById(seqId);
    }
    return super.create(data, session);
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<SalesOrderDocument | null> {
    const boundModel = this.connectionManager.bindModelToDb(salesOrderModel);

    if (status === "shipped") {
      const order = await boundModel.findById(id);
      if (!order) {
        throw new ValidationException("Sales order not found");
      }
      return this.shipOrder(id, order);
    }

    return boundModel.findByIdAndUpdate(id, { status }, { new: true });
  }

  /**
   * Ships a confirmed sales order by decrementing stock balances and creating
   * an OUT stock movement per shippable line. Validates that every line has
   * enough stock at the order's warehouse/location before mutating anything,
   * then updates the order status to "shipped". Runs atomically.
   * @param id - The sales order id
   * @param order - The loaded sales order document
   * @returns The updated sales order document
   */
  private async shipOrder(
    id: string,
    order: SalesOrderDocument,
  ): Promise<SalesOrderDocument> {
    const status = order.status as string;
    if (status === "shipped") {
      throw new ValidationException("This order has already been shipped.");
    }
    if (status !== "confirmed") {
      throw new ValidationException(
        `Cannot ship an order that is ${status}. The order must be confirmed first.`,
      );
    }

    const warehouseId = (order.warehouseId as any)?._id ?? order.warehouseId;
    const locationId = (order.locationId as any)?._id ?? order.locationId;
    if (!warehouseId || !locationId) {
      throw new ValidationException(
        "Set a warehouse and location on the order before shipping.",
      );
    }

    const lineItems = (order.lineItems ?? []) as any[];
    const toShip = lineItems
      .map((li: any) => {
        const productId = (li.productId as any)?._id ?? li.productId;
        const quantity = Number(li.quantity ?? 0);
        return { li, productId, quantity };
      })
      .filter(({ productId, quantity }) => !!productId && quantity > 0);

    if (toShip.length === 0) {
      throw new ValidationException(
        "No shippable lines on this order. Lines need a product and a quantity.",
      );
    }

    const reference = (order.number as string) ?? id;

    return await runTransaction<SalesOrderDocument>(undefined, async (s) => {
      const boundBalanceModel =
        this.connectionManager.bindModelToDb(stockBalanceModel);
      const boundMovementModel =
        this.connectionManager.bindModelToDb(stockMovementModel);

      for (const { li, productId, quantity } of toShip) {
        const balance = await boundBalanceModel
          .findOne({ productId, locationId, warehouseId })
          .session(s);

        if (!balance || (balance.quantity ?? 0) < quantity) {
          throw new ValidationException(
            `Insufficient stock for "${li.description}". Available: ${
              balance?.quantity ?? 0
            }, requested: ${quantity}`,
          );
        }
      }

      for (const { productId, quantity } of toShip) {
        await boundBalanceModel.findOneAndUpdate(
          { productId, locationId, warehouseId },
          { $inc: { quantity: -quantity } },
          { new: true, session: s },
        );

        await boundMovementModel.create(
          [
            {
              productId,
              warehouseId,
              locationId,
              quantity,
              type: MovementType.OUT,
              reference,
              notes: `Shipped from SO ${reference}`,
              date: new Date(),
            },
          ],
          { session: s },
        );
      }

      order.status = "shipped";
      return await order.save({ session: s });
    });
  }

  override async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<SalesOrderDocument> {
    if (data.currency !== undefined) {
      await this.assertCurrencyExists(data.currency);
    }

    if (Array.isArray(data.lineItems)) {
      const taxDocsMap = await this.assertLineTaxesValid(
        data.lineItems,
        session,
      );
      await this.recomputeTotals(data, taxDocsMap, session);
    }

    return super.update(data, session);
  }

  override async importCSV(
    data: Record<string, any>[],
    session?: ClientSession,
  ): Promise<SalesOrderDocument[]> {
    return await runTransaction<SalesOrderDocument[]>(
      session,
      async (newSession) => {
        const created: SalesOrderDocument[] = [];
        for (const row of data) {
          created.push(await this.create(row, newSession));
        }
        return created;
      },
    );
  }
}
