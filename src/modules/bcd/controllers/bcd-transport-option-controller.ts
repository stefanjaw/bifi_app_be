import { BCDTransportOptionDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDTransportOptionService } from "../services/bcd-transport-option-services";

export class BCDTransportOptionController extends BaseController<BCDTransportOptionDocument> {
  constructor() {
    super({ service: new BCDTransportOptionService() });
  }
}
