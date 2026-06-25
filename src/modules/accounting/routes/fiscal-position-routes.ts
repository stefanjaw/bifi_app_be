import { BaseRoutes } from "../../../system";
import { FiscalPositionDocument } from "../models/fiscal-position.model";
import { FiscalPositionController } from "../controllers/fiscal-position-controller";
import {
  FiscalPositionDTO,
  UpdateFiscalPositionDTO,
} from "../models/fiscal-position.dto";

const fiscalPositionController = new FiscalPositionController();

export class FiscalPositionRouter extends BaseRoutes<FiscalPositionDocument> {
  constructor() {
    super({
      controller: fiscalPositionController,
      endpoint: "/accounting/fiscal-positions",
      dtoCreateClass: FiscalPositionDTO,
      dtoUpdateClass: UpdateFiscalPositionDTO,
    });
  }
}
