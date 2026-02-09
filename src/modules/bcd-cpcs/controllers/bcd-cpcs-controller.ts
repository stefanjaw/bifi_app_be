import { BCDCpcsDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDCpcsService } from "../services/bcd-cpcs.services";

export class BCDCpcsController extends BaseController<BCDCpcsDocument> {
  constructor() {
    super({ service: new BCDCpcsService() });
  }
}