import { BCDAdditionalInformationTypeDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import {
  BCDAdditionalInformationTypeDTO,
  UpdateBCDAdditionalInformationTypeDTO,
} from "../models/bcd-additional-information-type.dto";
import { BCDAdditionalInformationTypeController } from "../controllers/bcd-additional-information-type-controller";

export class BCDAdditionalInformationTypeRouter extends BaseRoutes<BCDAdditionalInformationTypeDocument> {
  constructor() {
    super({
      controller: new BCDAdditionalInformationTypeController(),
      endpoint: "/bcd-additional-information-types",
      dtoCreateClass: BCDAdditionalInformationTypeDTO,
      dtoUpdateClass: UpdateBCDAdditionalInformationTypeDTO,
    });
  }
}
