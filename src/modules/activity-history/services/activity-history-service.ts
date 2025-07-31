import { BaseService } from "../../../system";
import { ActivityHistoryDocument } from "@mongodb-types";
import { activityHistoryModel } from "../models/activity-history.model";

export class ActivityHistoryService extends BaseService<ActivityHistoryDocument> {
  constructor() {
    super({ model: activityHistoryModel });
  }
}
