import { BaseController } from "../../../system";
import { UomDocument } from "../models/uom.model";
import { UomService } from "../services/uom-service";

const uomService = new UomService();

export class UomController extends BaseController<UomDocument> {
  constructor() {
    super({ service: uomService });
  }
}
