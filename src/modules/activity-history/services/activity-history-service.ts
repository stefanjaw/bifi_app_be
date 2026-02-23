import { ActivityHistoryDocument } from "@mongodb-types";
import { activityHistoryModel } from "../models/activity-history.model";
import { BaseService, runTransaction, userStorage } from "../../../system";
import { ClientSession } from "mongoose";
import dayjs, { Dayjs } from "dayjs";

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

  /**
   * Exports the activity history data to a CSV file.
   * The function runs within a transaction and returns a buffer containing the CSV data.
   * The CSV file will contain the following columns: Title, Details, PerformDate, Model, User, CreatedAt.
   * The User column will contain the username and email of the user who made the request if the userId is present.
   * The CreatedAt column will contain the date and time when the activity history document was created if the createdAt is present.
   * @param data - The optional filter data to export.
   * @returns A buffer containing the CSV data.
   */
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
