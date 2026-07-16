import { BaseController } from "../../../system";
import { UomDocument } from "../models/uom.model";
import { UomService } from "../services/uom-service";

const uomService = new UomService();

/** Express controller for unit of measure (UOM) CRUD operations */
export class UomController extends BaseController<UomDocument> {
  constructor() {
    super({ service: uomService });
  }
}
