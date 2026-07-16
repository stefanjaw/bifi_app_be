import { BaseRoutes } from "../../../system";
import { BedHistoryController } from "../controllers/bed-history-controller";
import { BedHistoryDTO, UpdateBedHistoryDTO } from "../models/bed-history.dto";

const bedHistoryController = new BedHistoryController();

export class BedHistoryRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: bedHistoryController,
      endpoint: "/bed-histories",
      dtoCreateClass: BedHistoryDTO,
      dtoUpdateClass: UpdateBedHistoryDTO,
    });
  }
}
