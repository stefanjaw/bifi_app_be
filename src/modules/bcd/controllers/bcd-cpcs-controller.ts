import { BCDCpcDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDCpcService } from "../services/bcd-cpcs.services";

export class BCDCpcController extends BaseController<BCDCpcDocument> {
  constructor() {
    super({ service: new BCDCpcService() });
  }
}
