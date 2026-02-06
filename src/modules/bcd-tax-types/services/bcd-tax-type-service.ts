import { BCDTaxTypeDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdTaxTypeModel } from "../models/bcd-tax-type.model";

export class BCDTaxTypeService extends BaseService<BCDTaxTypeDocument> {
  constructor() {
    super({ model: bcdTaxTypeModel });
  }
}
