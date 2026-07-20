import { BaseRoutes } from "../../../../system";
import { BedController } from "../controllers/bed-controller";
import { BedDTO, UpdateBedDTO } from "../models/bed.dto";
import { BedDocument } from "../models/bed.model";

const bedController = new BedController();
/** Route definitions for bed endpoints */
export class BedRouter extends BaseRoutes<BedDocument> {
  constructor() {
    super({
      controller: bedController,
      endpoint: "/beds",
      dtoCreateClass: BedDTO,
      dtoUpdateClass: UpdateBedDTO,
    });
  }
}
