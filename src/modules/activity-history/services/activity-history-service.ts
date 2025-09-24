import { ActivityHistoryDocument } from "@mongodb-types";
import { activityHistoryModel } from "../models/activity-history.model";
import { BaseService, UserStore } from "../../../system";
import { ClientSession } from "mongoose";

export class ActivityHistoryService extends BaseService<ActivityHistoryDocument> {
  constructor() {
    super({ model: activityHistoryModel });
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ActivityHistoryDocument> {
    return super.create(
      { ...data, userId: UserStore.getInstance().user?.id },
      session
    );
  }
}
