import { BaseController } from "../../../../system";
import { BedHistoryDocument } from "@mongodb-types";
import { BedHistoryService } from "../services/bed-history-service";

const bedHistoryService = new BedHistoryService();

/** Controller for bed history audit records */
export class BedHistoryController extends BaseController<BedHistoryDocument> {
  constructor() {
    super({ service: bedHistoryService });
  }
}
