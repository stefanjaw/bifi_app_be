import { BCDDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDService } from "../services/bcd-service";

export class BCDController extends BaseController<BCDDocument> {
  constructor() {
    super({
      service: new BCDService(),
    });
  }
}
