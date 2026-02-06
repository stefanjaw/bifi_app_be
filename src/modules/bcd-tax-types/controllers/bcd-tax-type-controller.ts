import { BCDTaxTypeDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDTaxTypeService } from "../services/bcd-tax-type-service";

export class BCDTaxTypeController extends BaseController<BCDTaxTypeDocument> {
  constructor() {
    super({ service: new BCDTaxTypeService() });
  }
}
