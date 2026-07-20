import { BaseRoutes } from "../../../../system";
import { BedHistoryController } from "../controllers/bed-history-controller";
import { BedHistoryDTO, UpdateBedHistoryDTO } from "../models/bed-history.dto";
import { BedHistoryDocument } from "../models/bed-history.model";

const bedHistoryController = new BedHistoryController();

export class BedHistoryRouter extends BaseRoutes<BedHistoryDocument> {
  constructor() {
    super({
      controller: bedHistoryController,
      endpoint: "/bed-histories",
      dtoCreateClass: BedHistoryDTO,
      dtoUpdateClass: UpdateBedHistoryDTO,
    });
  }
}
