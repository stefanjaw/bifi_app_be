import { BCDTransportOptionDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDTransportOptionController } from "../controllers/bcd-transport-option-controller";
import {
  BCDTransportOptionDTO,
  UpdateBCDTransportOptionDTO,
} from "../models/bcd-transport-option.dto";

export class BCDTransportOptionRouter extends BaseRoutes<BCDTransportOptionDocument> {
  constructor() {
    super({
      controller: new BCDTransportOptionController(),
      endpoint: "/bcd-transport-options",
      dtoCreateClass: BCDTransportOptionDTO,
      dtoUpdateClass: UpdateBCDTransportOptionDTO,
    });
  }
}
