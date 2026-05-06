import { ClientSession, Types } from "mongoose";
import { BaseService } from "../../../system";
import { purchaseOrderModel, PurchaseOrderDocument } from "../models/purchase-order.model";
import { PurchaseSettingsService } from "./purchase-settings-service";
import { SequenceService } from "../../sequences/services/sequence-service";
import { taxModel, TaxType } from "../../accounting/models/tax.model";
import {
  calculateSubtotal,
  calculateTaxesPerLine,
  calculateGrandTotal,
  calculateLineItemTotal,
  TaxInput,
} from "../../../system/price-calculator";

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
    const { taxTotal, appliedTaxes } = calculateTaxesPerLine(lineItems, taxDocsMap);
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
    if (Array.isArray(data.lineItems)) {
      const taxDocsMap = await this.assertLineTaxesValid(data.lineItems, session);
      this.recomputeTotals(data, taxDocsMap);
    }
    return super.update(data, session);
  }

  async updateStatus(id: string, status: string) {
    const boundModel = this.connectionManager.bindModelToDb(this.model);
    return await boundModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }
}
