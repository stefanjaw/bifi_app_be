import { BaseRoutes } from "../../../system";
import { BedController } from "../controllers/bed-controller";
import { BedDTO, UpdateBedDTO } from "../models/bed.dto";

const bedController = new BedController();

export class BedRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: bedController,
      endpoint: "/beds",
      dtoCreateClass: BedDTO,
      dtoUpdateClass: UpdateBedDTO,
    });
  }
}
