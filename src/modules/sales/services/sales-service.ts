import { BaseService } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { salesOrderModel } from "../../sales-orders/models/sales-order.model";
import { crmModel } from "../../crm/models/crm.model";

export interface SalesDashboard {
  totalRevenueMTD: number;
  totalRevenue: number;
  openOpportunitiesValue: number;
  closedWonCount: number;
  conversionRate: number;
  revenueByStage: { stageName: string; total: number }[];
  topSalesReps: { username: string; total: number }[];
}

export class SalesService extends BaseService<SalesOrderDocument> {
  constructor() {
    super({ model: salesOrderModel });
  }

  async getDashboard(): Promise<SalesDashboard> {
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

    const boundSalesOrderModel =
      this.connectionManager.bindModelToDb(salesOrderModel);
    const boundCrmModel = this.connectionManager.bindModelToDb(crmModel);

    const [
      revenueMTDResult,
      totalRevenueResult,
      closedWonCount,
      totalCrmDeals,
      openOpportunitiesResult,
      revenueByStage,
      topSalesReps,
    ] = await Promise.all([
      boundSalesOrderModel.aggregate([
        {
          $match: {
            closeDate: { $gte: startOfMonth, $lte: endOfMonth },
            active: true,
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      boundSalesOrderModel.aggregate([
        { $match: { active: true } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      boundSalesOrderModel.countDocuments({ active: true }),
      boundCrmModel.countDocuments({ active: true }),
      boundCrmModel.aggregate([
        {
          $lookup: {
            from: "crmstages",
            localField: "stage",
            foreignField: "_id",
            as: "stageData",
          },
        },
        { $unwind: { path: "$stageData", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            active: true,
            $or: [
              { stageData: { $exists: false } },
              { "stageData.isWon": false, "stageData.isLost": false },
            ],
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      boundCrmModel.aggregate([
        {
          $lookup: {
            from: "crmstages",
            localField: "stage",
            foreignField: "_id",
            as: "stageData",
          },
        },
        { $unwind: { path: "$stageData", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$stageData.name", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        {
          $project: {
            _id: 0,
            stageName: { $ifNull: ["$_id", "No Stage"] },
            total: 1,
          },
        },
      ]),
      boundSalesOrderModel.aggregate([
        { $match: { active: true, salesperson: { $ne: null } } },
        {
          $lookup: {
            from: "users",
            localField: "salesperson",
            foreignField: "_id",
            as: "salespersonData",
          },
        },
        {
          $unwind: {
            path: "$salespersonData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$salespersonData.username",
            total: { $sum: "$amount" },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            username: { $ifNull: ["$_id", "Unknown"] },
            total: 1,
          },
        },
      ]),
    ]);

    const totalRevenueMTD = revenueMTDResult[0]?.total ?? 0;
    const totalRevenue = totalRevenueResult[0]?.total ?? 0;
    const openOpportunitiesValue = openOpportunitiesResult[0]?.total ?? 0;
    const conversionRate =
      totalCrmDeals > 0
        ? Math.round((closedWonCount / totalCrmDeals) * 100 * 10) / 10
        : 0;

    return {
      totalRevenueMTD,
      totalRevenue,
      openOpportunitiesValue,
      closedWonCount,
      conversionRate,
      revenueByStage,
      topSalesReps,
    };
  }
}
