import { ClientSession, Types } from "mongoose";
import {
  BaseService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { fireNotification } from "../../notifications/services/notification-service";
import { stockBalanceModel } from "../../inventory/models/stock-balance.model";
import {
  stockMovementModel,
  MovementType,
} from "../../inventory/models/stock-movement.model";
import {
  purchaseOrderModel,
  PurchaseOrderDocument,
} from "../models/purchase-order.model";
import { PurchaseSettingsService } from "./purchase-settings-service";
import { SequenceService } from "../../sequences/services/sequence-service";
import { taxModel, TaxType } from "../../accounting/models/tax.model";
import {
  calculateSubtotal,
  calculateTaxesPerLine,
  calculateGrandTotal,
  calculateLineItemTotal,
  TaxInput,
} from "../../../system/libraries/orders/price-calculator";

const purchaseSettingsService = new PurchaseSettingsService();
const sequenceService = new SequenceService();

interface NormalizedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxIds: string[];
}

export class PurchaseOrderService extends BaseService<PurchaseOrderDocument> {
  constructor() {
    super({ model: purchaseOrderModel });
  }

  /**
   * Collects all unique taxIds from every line item, fetches them in a single
   * query, validates that each is active and of type PURCHASE, and returns a
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
          const err: any = new Error(`Invalid taxId: ${id}`);
          err.status = 400;
          throw err;
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
      const err: any = new Error(`Tax not found: ${missing}`);
      err.status = 400;
      throw err;
    }

    const taxMap = new Map<string, TaxInput>();
    for (const tax of foundTaxes as any[]) {
      if (!tax.active) {
        const err: any = new Error(`Tax "${tax.name}" is inactive`);
        err.status = 400;
        throw err;
      }
      if (tax.taxType !== TaxType.PURCHASE) {
        const err: any = new Error(
          `Tax "${tax.name}" is not a purchase tax (taxType: ${tax.taxType})`,
        );
        err.status = 400;
        throw err;
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
   * subtotal, taxTotal, grandTotal, totalAmount, and taxes using per-line taxIds.
   */
  private recomputeTotals(
    data: Record<string, any>,
    taxDocsMap: Map<string, TaxInput>,
  ): void {
    const lineItems: NormalizedLineItem[] = Array.isArray(data.lineItems)
      ? data.lineItems.map((item: any) => {
          const quantity = Number(item?.quantity ?? 0);
          const unitPrice = Number(item?.unitPrice ?? 0);
          return {
            ...item,
            quantity,
            unitPrice,
            total: calculateLineItemTotal(quantity, unitPrice),
            taxIds: Array.isArray(item.taxIds) ? item.taxIds : [],
          };
        })
      : [];

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
    data.totalAmount = grandTotal;
    data.taxes = appliedTaxes;
  }

  private async generatePoNumber(): Promise<string> {
    const settings = await purchaseSettingsService.getSettings();
    const purchaseSequence = settings?.purchaseSequence as any;
    if (purchaseSequence) {
      const seqId =
        typeof purchaseSequence === "object"
          ? purchaseSequence._id.toString()
          : purchaseSequence.toString();
      return sequenceService.getNextNumberById(seqId);
    }
    const boundModel = this.connectionManager.bindModelToDb(this.model);
    const count = await boundModel.countDocuments();
    const number = String(count + 1).padStart(4, "0");
    return `PO-${number}`;
  }

  override async create(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<PurchaseOrderDocument> {
    const rawLineItems: { taxIds?: string[] }[] = Array.isArray(data.lineItems)
      ? data.lineItems
      : [];
    const taxDocsMap = await this.assertLineTaxesValid(rawLineItems, session);
    this.recomputeTotals(data, taxDocsMap);
    data.poNumber = await this.generatePoNumber();
    return super.create(data, session);
  }

  override async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<PurchaseOrderDocument> {
    if (data.status === "received" || data.status === "partially_received") {
      throw new ValidationException(
        "Use the Receive action to record received goods; this status cannot be set manually.",
      );
    }
    if (Array.isArray(data.lineItems)) {
      const taxDocsMap = await this.assertLineTaxesValid(
        data.lineItems,
        session,
      );
      this.recomputeTotals(data, taxDocsMap);
    }
    return super.update(data, session);
  }

  async updateStatus(id: string, status: string) {
    if (status === "received" || status === "partially_received") {
      throw new ValidationException(
        "Use the Receive action to record received goods; this status cannot be set manually.",
      );
    }
    const boundModel = this.connectionManager.bindModelToDb(this.model);
    const update: Record<string, any> = { status };

    const existing = await boundModel
      .findById(id)
      .select("issueDate createdBy poNumber")
      .lean();

    if (status === "confirmed") {
      if (!existing?.issueDate) {
        update.issueDate = new Date();
      }
    }

    const result = await boundModel.findByIdAndUpdate(id, update, {
      new: true,
    });

    // Alert 5: PO sent to supplier
    if (status === "sent" && (existing as any)?.createdBy) {
      await fireNotification({
        context: { creator: (existing as any).createdBy },
        type: "po_sent",
        title: "Purchase Order sent",
        body: `PO ${
          (existing as any).poNumber ?? id
        } has been sent to the supplier.`,
        link: `/purchases/orders/${id}`,
        module: "purchases",
      });
    }

    // Alert 5: PO received / partially received
    if (
      (status === "received" || status === "partially_received") &&
      (existing as any)?.createdBy
    ) {
      const label =
        status === "received" ? "fully received" : "partially received";
      await fireNotification({
        context: { creator: (existing as any).createdBy },
        type: "po_received",
        title: `Purchase Order ${label}`,
        body: `PO ${(existing as any).poNumber ?? id} has been ${label}.`,
        link: `/purchases/orders/${id}`,
        module: "purchases",
      });
    }

    return result;
  }

  /**
   * Receives quantities against a purchase order's line items, moving the
   * received goods into inventory at the PO's destination warehouse/location.
   * For each received line it upserts the StockBalance (+qty) and records an
   * IN StockMovement, then updates each line's receivedQuantity and recomputes
   * the PO status (partially_received / received). Runs atomically.
   */
  async receive(id: string, lines: { index: number; quantity: number }[]) {
    const boundModel = this.connectionManager.bindModelToDb(this.model);
    const po = await boundModel.findById(id);
    if (!po) {
      throw new ValidationException("Purchase order not found");
    }
    const receivableStatuses = ["confirmed", "sent", "partially_received"];
    if (!receivableStatuses.includes(po.status as string)) {
      throw new ValidationException(
        `Cannot receive a purchase order that is ${po.status}. The order must be confirmed or sent first.`,
      );
    }

    const warehouseId = (po.warehouseId as any)?._id ?? po.warehouseId;
    const locationId = (po.locationId as any)?._id ?? po.locationId;
    if (!warehouseId || !locationId) {
      throw new ValidationException(
        "Set a destination warehouse and location on the order before receiving.",
      );
    }

    const lineItems = (po.lineItems ?? []) as any[];

    const aggregated = new Map<number, number>();
    for (const l of lines ?? []) {
      const index = Number(l.index);
      const quantity = Number(l.quantity);
      if (
        !Number.isFinite(index) ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        continue;
      }
      aggregated.set(index, (aggregated.get(index) ?? 0) + quantity);
    }

    const toReceive = Array.from(aggregated.entries()).map(
      ([index, quantity]) => ({ index, quantity }),
    );

    if (toReceive.length === 0) {
      throw new ValidationException("No quantities provided to receive.");
    }

    for (const line of toReceive) {
      const li = lineItems[line.index];
      if (!li) {
        throw new ValidationException(`Invalid line item index: ${line.index}`);
      }
      const productId = (li.productId as any)?._id ?? li.productId;
      if (!productId) {
        throw new ValidationException(
          `Line "${li.description}" has no product and cannot be received into inventory.`,
        );
      }
      const ordered = Number(li.quantity ?? 0);
      const alreadyReceived = Number(li.receivedQuantity ?? 0);
      if (alreadyReceived + line.quantity > ordered) {
        throw new ValidationException(
          `Cannot receive ${line.quantity} of "${li.description}" — only ${
            ordered - alreadyReceived
          } remaining.`,
        );
      }
    }

    return runTransaction<PurchaseOrderDocument>(undefined, async (session) => {
      const boundBalanceModel =
        this.connectionManager.bindModelToDb(stockBalanceModel);
      const boundMovementModel =
        this.connectionManager.bindModelToDb(stockMovementModel);

      for (const line of toReceive) {
        const li = lineItems[line.index];
        const productId = (li.productId as any)?._id ?? li.productId;

        await boundBalanceModel.findOneAndUpdate(
          { productId, locationId, warehouseId },
          { $inc: { quantity: line.quantity } },
          { upsert: true, new: true, setDefaultsOnInsert: true, session },
        );

        await boundMovementModel.create(
          [
            {
              productId,
              warehouseId,
              locationId,
              quantity: line.quantity,
              type: MovementType.IN,
              reference: po.poNumber,
              notes: `Received from PO ${po.poNumber}`,
              date: new Date(),
            },
          ],
          { session },
        );

        li.receivedQuantity = Number(li.receivedQuantity ?? 0) + line.quantity;
      }

      const allReceived = lineItems.every(
        (li) => Number(li.receivedQuantity ?? 0) >= Number(li.quantity ?? 0),
      );
      const anyReceived = lineItems.some(
        (li) => Number(li.receivedQuantity ?? 0) > 0,
      );
      po.status = allReceived
        ? "received"
        : anyReceived
          ? "partially_received"
          : po.status;

      await po.save({ session });

      if ((po as any).createdBy) {
        const label = allReceived ? "fully received" : "partially received";
        await fireNotification({
          context: { creator: (po as any).createdBy },
          type: "po_received",
          title: `Purchase Order ${label}`,
          body: `PO ${po.poNumber ?? id} has been ${label}.`,
          link: `/purchases/orders/${id}`,
          module: "purchases",
        });
      }

      return po;
    });
  }
}
