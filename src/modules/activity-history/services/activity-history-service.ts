import { ActivityHistoryDocument } from "@mongodb-types";
import { activityHistoryModel } from "../models/activity-history.model";
import { BaseService, userStorage } from "../../../system";
import { ClientSession } from "mongoose";

export class ActivityHistoryService extends BaseService<ActivityHistoryDocument> {
  constructor() {
    super({ model: activityHistoryModel });
  }

  /**
   * Creates a new activity history document with the given data and the user who made the request as the userId.
   * The function runs within a transaction and returns the created record.
   * @param data - The data to create the record with.
   * @param session - The optional client session to use for the transaction.
   * @returns The created record document.
   */
  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined,
  ): Promise<ActivityHistoryDocument> {
    return super.create(
      { ...data, userId: userStorage.getStore()?.user?._id },
      session,
    );
  }
}
