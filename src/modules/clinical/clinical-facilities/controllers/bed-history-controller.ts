import { BaseController } from "../../../../system";
import { BedHistoryDocument } from "@mongodb-types";
import { BedHistoryService } from "../services/bed-history-service";

const bedHistoryService = new BedHistoryService();

export class BedHistoryController extends BaseController<BedHistoryDocument> {
  constructor() {
    super({ service: bedHistoryService });
  }
}
