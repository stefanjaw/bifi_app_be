import { BaseService } from "../../../system";
import {
  fiscalPositionModel,
  FiscalPositionDocument,
} from "../models/fiscal-position.model";

export class FiscalPositionService extends BaseService<FiscalPositionDocument> {
  constructor() {
    super({ model: fiscalPositionModel });
  }
}
