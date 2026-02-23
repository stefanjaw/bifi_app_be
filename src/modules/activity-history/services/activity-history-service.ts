import { ActivityHistoryDocument } from "@mongodb-types";
import { activityHistoryModel } from "../models/activity-history.model";
import { BaseService, runTransaction, UserStore } from "../../../system";
import { ClientSession } from "mongoose";
import dayjs, { Dayjs } from "dayjs";

export class ActivityHistoryService extends BaseService<ActivityHistoryDocument> {
  constructor() {
    super({ model: activityHistoryModel });
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined,
  ): Promise<ActivityHistoryDocument> {
    return super.create(
      { ...data, userId: UserStore.getInstance().user?.id },
      session,
    );
  }

  override async exportCSV(data?: Record<string, any>[]): Promise<Buffer> {
    return runTransaction<Buffer>(undefined, async (newSession) => {
      const activityHistory = await this.model
        .find()
        .populate("userId")
        .session(newSession);

      const json = activityHistory.map((p) => ({
        Title: p.title,

        Details: p.details ?? "N/A",

        PerformDate: p.performDate
          ? dayjs(p.performDate).format("DD MMM YYYY")
          : "N/A",
        Model: p.model,
        User: p.userId ? `${p.userId.username} (${p.userId.email})` : "N/A",
        CreatedAt: p.createdAt
          ? dayjs(p.createdAt).format("DD MMM YYYY HH:mm")
          : "N/A",
      }));

      return super.exportCSV(json);
    });
  }
}
