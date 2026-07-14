import { BCDTaxIdDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdTaxIdModel } from "../models/bcd-tax-id.model";

export class BCDTaxIdService extends BaseService<BCDTaxIdDocument> {
  constructor() {
    super({ model: bcdTaxIdModel });
  }
}
