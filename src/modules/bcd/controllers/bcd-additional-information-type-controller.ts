import { BCDAdditionalInformationTypeDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDAdditionalInformationTypeService } from "../services/bcd-additional-information-type-service";

export class BCDAdditionalInformationTypeController extends BaseController<BCDAdditionalInformationTypeDocument> {
  constructor() {
    super({ service: new BCDAdditionalInformationTypeService() });
  }
}
