import { BCDPortDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDPortService } from "../services/bcd-port.services";

export class BCDPortController extends BaseController<BCDPortDocument> {
  constructor() {
    super({ service: new BCDPortService() });
  }
}
