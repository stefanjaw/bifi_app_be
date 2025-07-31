import { ActivityHistoryService } from "../services/activity-history-service";
import { ActivityHistoryDocument } from "@mongodb-types";
import { BaseController } from "../../../system";

const activityHistoryService = new ActivityHistoryService();

export class ActivityHistoryController extends BaseController<ActivityHistoryDocument> {
  constructor() {
    super({ service: activityHistoryService });
  }
}
