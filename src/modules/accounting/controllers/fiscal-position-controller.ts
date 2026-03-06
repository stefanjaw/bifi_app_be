import { BaseController } from "../../../system";
import { FiscalPositionDocument } from "../models/fiscal-position.model";
import { FiscalPositionService } from "../services/fiscal-position-service";

const fiscalPositionService = new FiscalPositionService();

export class FiscalPositionController extends BaseController<FiscalPositionDocument> {
  constructor() {
    super({ service: fiscalPositionService });
  }
}
