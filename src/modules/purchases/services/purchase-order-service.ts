import { BaseService } from "../../../system";
import { purchaseOrderModel, PurchaseOrderDocument } from "../models/purchase-order.model";
import { PurchaseOrderDTO } from "../models/purchase-order.dto";
import { PurchaseSettingsService } from "./purchase-settings-service";
import { SequenceService } from "../../sequences/services/sequence-service";

export class PurchaseOrderService extends BaseService<PurchaseOrderDocument> {
  private purchaseSettingsService = new PurchaseSettingsService();
  private sequenceService = new SequenceService();

  constructor() {
    super({ model: purchaseOrderModel });
  }

  private calculateTotal(lineItems: Array<{ quantity: number; unitPrice: number; total: number }>): number {
    return lineItems.reduce((sum, item) => {
      item.total = item.quantity * item.unitPrice;
      return sum + item.total;
    }, 0);
  }

  private async generatePoNumber(): Promise<string> {
    const settings = await this.purchaseSettingsService.getSettings();
    const purchaseSequence = settings?.purchaseSequence as any;
    if (purchaseSequence) {
      const seqId =
        typeof purchaseSequence === "object"
          ? purchaseSequence._id.toString()
          : purchaseSequence.toString();
      return this.sequenceService.getNextNumberById(seqId);
    }
    const boundModel = this.connectionManager.bindModelToDb(this.model);
    const count = await boundModel.countDocuments();
    const number = String(count + 1).padStart(4, "0");
    return `PO-${number}`;
  }

  override async create(data: PurchaseOrderDTO, session?: any) {
    if (data.lineItems && data.lineItems.length > 0) {
      (data as any).totalAmount = this.calculateTotal(data.lineItems);
    }
    (data as any).poNumber = await this.generatePoNumber();
    return await super.create(data, session);
  }

  override async update(data: PurchaseOrderDTO & { _id: string }, session?: any) {
    if (data.lineItems && data.lineItems.length > 0) {
      (data as any).totalAmount = this.calculateTotal(data.lineItems);
    }
    return await super.update(data, session);
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
