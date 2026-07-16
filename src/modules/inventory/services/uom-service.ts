import { BaseService } from "../../../system";
import { uomModel, UomDocument } from "../models/uom.model";

/** Business logic service for UOM operations */
export class UomService extends BaseService<UomDocument> {
  constructor() {
    super({ model: uomModel });
  }
}
