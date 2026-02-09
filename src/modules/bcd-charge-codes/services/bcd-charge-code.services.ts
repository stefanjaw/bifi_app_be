import { BCDChargeCodeDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdChargeCodeModel } from "../models/bcd-charge-code.model";

export class BCDChargeCodeService extends BaseService<BCDChargeCodeDocument> {
  constructor() {
    super({
      model: bcdChargeCodeModel,
    });
  }
}
