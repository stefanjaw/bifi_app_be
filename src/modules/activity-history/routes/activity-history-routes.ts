import { ActivityHistoryDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { ActivityHistoryController } from "../controllers/activity-history-controller";
import {
  ActivityHistoryDTO,
  UpdateActivityHistoryDTO,
} from "../models/activity-history.dto";

const activityHistoryController = new ActivityHistoryController();

export class ActivityHistoryRouter extends BaseRoutes<ActivityHistoryDocument> {
  constructor() {
    super({
      controller: activityHistoryController,
      endpoint: "/activity-histories",
      dtoCreateClass: ActivityHistoryDTO,
      dtoUpdateClass: UpdateActivityHistoryDTO,
    });
  }
}
