import { ClientSession } from "mongoose";
import { BaseService } from "../../../system";
import {
  purchaseStageModel,
  PurchaseStageDocument,
} from "../models/purchase-stage.model";

export class PurchaseStageService extends BaseService<PurchaseStageDocument> {
  constructor() {
    super({
      model: purchaseStageModel,
    });
  }

  private async clearOtherDefaults(excludeId?: string): Promise<void> {
    const filter: Record<string, any> = {};
    if (excludeId) filter._id = { $ne: excludeId };
    await purchaseStageModel.updateMany(filter, { isDefault: false });
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession,
  ): Promise<PurchaseStageDocument> {
    if (data.isDefault) {
      await this.clearOtherDefaults();
    }
    return super.create(data, session);
  }

  override async update(
    data: Record<string, any>,
    session?: ClientSession,
  ): Promise<PurchaseStageDocument> {
    if (data.isDefault) {
      await this.clearOtherDefaults(data._id);
    }
    return super.update(data, session);
  }
}

/** Seeds a default "Draft" purchase stage if no stages exist yet. Safe to call on startup. */
export async function seedPurchaseStages(): Promise<void> {
  const count = await purchaseStageModel.countDocuments();
  if (count === 0) {
    await purchaseStageModel.create({
      name: "Draft",
      description: "Initial stage for new purchase orders",
      color: "#64748b",
      order: 0,
      isDefault: true,
      active: true,
    });
    console.log("Seeded default 'Draft' purchase stage.");
  }
}
