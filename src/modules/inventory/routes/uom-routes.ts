import { BaseRoutes } from "../../../system";
import { UomDocument } from "../models/uom.model";
import { UomController } from "../controllers/uom-controller";
import { UomDTO, UpdateUomDTO } from "../models/uom.dto";

const uomController = new UomController();

/** Route definitions for UOM endpoints */
export class UomRouter extends BaseRoutes<UomDocument> {
  constructor() {
    super({
      controller: uomController,
      endpoint: "/inventory/uoms",
      dtoCreateClass: UomDTO,
      dtoUpdateClass: UpdateUomDTO,
    });
  }
}
