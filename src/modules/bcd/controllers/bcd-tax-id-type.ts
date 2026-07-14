import { BCDTaxIdDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDTaxIdService } from "../services/bcd-tax-id-service";

export class BCDTaxIdController extends BaseController<BCDTaxIdDocument> {
  constructor() {
    super({ service: new BCDTaxIdService() });
  }
}
