import { BaseService } from "../../../system";
import {
  purchaseOrderModel,
  PurchaseOrderDocument,
} from "../models/purchase-order.model";

export interface PurchasesDashboard {
  totalSpendMTD: number;
  openOrders: number;
  pendingReceipt: number;
  ordersThisMonth: number;
}

export class PurchasesDashboardService extends BaseService<PurchaseOrderDocument> {
  constructor() {
    super({ model: purchaseOrderModel });
  }

  async getDashboard(): Promise<PurchasesDashboard> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const boundModel = this.connectionManager.bindModelToDb(purchaseOrderModel);

    const [spendMTDResult, openOrders, pendingReceipt, ordersThisMonth] =
      await Promise.all([
        boundModel.aggregate([
          { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        boundModel.countDocuments({
          status: { $in: ["draft", "confirmed", "sent", "partially_received"] },
        }),
        boundModel.countDocuments({
          status: { $in: ["sent", "partially_received"] },
        }),
        boundModel.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),
      ]);

    return {
      totalSpendMTD: spendMTDResult[0]?.total ?? 0,
      openOrders,
      pendingReceipt,
      ordersThisMonth,
    };
  }
}
