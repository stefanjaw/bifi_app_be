import { BCDTypeDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDTypeService } from "../services/bcd-type-service";

export class BCDTypeController extends BaseController<BCDTypeDocument> {
  constructor() {
    super({ service: new BCDTypeService() });
  }
}
