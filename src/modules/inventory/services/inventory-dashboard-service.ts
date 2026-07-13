import { BaseService } from "../../../system";
import {
  stockBalanceModel,
  StockBalanceDocument,
} from "../models/stock-balance.model";
import { productModel } from "../models/product.model";

export interface InventoryDashboardProduct {
  _id: string;
  name: string;
  sku: string;
  totalQty: number;
}

export interface InventoryDashboard {
  totalProducts: number;
  totalStockValue: number;
  outOfStockItems: number;
  lowStockItems: number;
  outOfStockProducts: InventoryDashboardProduct[];
  lowStockProducts: InventoryDashboardProduct[];
}

export class InventoryDashboardService extends BaseService<StockBalanceDocument> {
  constructor() {
    super({ model: stockBalanceModel });
  }

  async getDashboard(): Promise<InventoryDashboard> {
    const boundBalanceModel =
      this.connectionManager.bindModelToDb(stockBalanceModel);
    const boundProductModel =
      this.connectionManager.bindModelToDb(productModel);

    const [totalProducts, stockValueResult, stockByProduct] = await Promise.all(
      [
        boundProductModel.countDocuments({ active: true }),
        boundBalanceModel.aggregate([
          { $group: { _id: "$productId", totalQty: { $sum: "$quantity" } } },
          {
            $lookup: {
              from: "inventoryproducts",
              localField: "_id",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              value: {
                $multiply: [
                  "$totalQty",
                  { $ifNull: ["$product.costPrice", 0] },
                ],
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$value" } } },
        ]),
        boundBalanceModel.aggregate([
          { $group: { _id: "$productId", totalQty: { $sum: "$quantity" } } },
        ]),
      ],
    );

    const inStockIds = (stockByProduct as any[])
      .filter((r) => r.totalQty >= 1)
      .map((r) => r._id);

    const lowStockEntries = (stockByProduct as any[]).filter(
      (r) => r.totalQty >= 1 && r.totalQty <= 4,
    );
    const lowStockIds = lowStockEntries.map((r) => r._id);
    const lowStockQtyMap = new Map<string, number>(
      lowStockEntries.map((r) => [r._id.toString(), r.totalQty]),
    );

    const [outOfStockItems, lowStockItems, outOfStockDocs, lowStockDocs] =
      await Promise.all([
        boundProductModel.countDocuments({
          active: true,
          _id: { $nin: inStockIds },
        }),
        boundProductModel.countDocuments({
          active: true,
          _id: { $in: lowStockIds },
        }),
        boundProductModel
          .find(
            { active: true, _id: { $nin: inStockIds } },
            { name: 1, sku: 1 },
          )
          .limit(20)
          .lean(),
        boundProductModel
          .find(
            { active: true, _id: { $in: lowStockIds } },
            { name: 1, sku: 1 },
          )
          .limit(20)
          .lean(),
      ]);

    const outOfStockProducts: InventoryDashboardProduct[] = (
      outOfStockDocs as any[]
    ).map((p) => ({ _id: p._id, name: p.name, sku: p.sku, totalQty: 0 }));

    const lowStockProducts: InventoryDashboardProduct[] = (
      lowStockDocs as any[]
    ).map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      totalQty: lowStockQtyMap.get(p._id.toString()) ?? 0,
    }));

    return {
      totalProducts,
      totalStockValue: (stockValueResult as any[])[0]?.total ?? 0,
      outOfStockItems,
      lowStockItems,
      outOfStockProducts,
      lowStockProducts,
    };
  }
}
