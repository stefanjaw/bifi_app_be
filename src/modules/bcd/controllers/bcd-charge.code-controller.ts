import { BCDChargeCodeDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDChargeCodeService } from "../services/bcd-charge-code.services";

export class BCDChargeCodeController extends BaseController<BCDChargeCodeDocument> {
  constructor() {
    super({ service: new BCDChargeCodeService() });
  }
}
