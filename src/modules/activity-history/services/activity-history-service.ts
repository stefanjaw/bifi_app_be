import { ActivityHistoryDocument } from "@mongodb-types";
import { activityHistoryModel } from "../models/activity-history.model";
import { BaseService } from "../../../system";

export class ActivityHistoryService extends BaseService<ActivityHistoryDocument> {
  constructor() {
    super({ model: activityHistoryModel });
  }
}
