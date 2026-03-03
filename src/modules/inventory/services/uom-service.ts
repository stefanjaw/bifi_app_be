import { BaseService } from "../../../system";
import { uomModel, UomDocument } from "../models/uom.model";

export class UomService extends BaseService<UomDocument> {
  constructor() {
    super({ model: uomModel });
  }
}
