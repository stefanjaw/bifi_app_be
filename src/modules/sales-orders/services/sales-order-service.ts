import { ClientSession, Types } from "mongoose";
import { BaseService } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { salesOrderModel } from "../models/sales-order.model";
import { SalesSettingsService } from "../../sales/services/sales-settings-service";
import { SequenceService } from "../../sequences/services/sequence-service";
import { CurrencyService } from "../../currency/services/currency-service";
import { taxModel, TaxType } from "../../accounting/models/tax.model";
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
      if (tax.taxType !== TaxType.SALES) {
        const err: any = new Error(
          `Tax "${tax.name}" is not a sales tax (taxType: ${tax.taxType})`,
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
   * subtotal, taxTotal, grandTotal, and amount using per-line taxIds.
   * The frontend MUST NOT be trusted to provide these computed values.
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
      const err: any = new Error("Invalid currency reference");
      err.status = 400;
      throw err;
    }

    const found = await currencyService.getById(id, undefined);
    if (!found) {
      const err: any = new Error("Invalid currency reference");
      err.status = 400;
      throw err;
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

    this.recomputeTotals(data, taxDocsMap);

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

  override async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<SalesOrderDocument> {
    if (data.currency !== undefined) {
      await this.assertCurrencyExists(data.currency);
    }

    if (Array.isArray(data.lineItems)) {
      const taxDocsMap = await this.assertLineTaxesValid(data.lineItems, session);
      this.recomputeTotals(data, taxDocsMap);
    }

    return super.update(data, session);
  }
}
