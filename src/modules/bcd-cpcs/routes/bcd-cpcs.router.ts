import { BCDCpcDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDCpcController } from "../controllers/bcd-cpcs-controller";
import { BCDCpcDTO, UpdateBCDCpcDTO } from "../models/bcd-cpcs.dto";

export class BCDCpcRouter extends BaseRoutes<BCDCpcDocument> {
  constructor() {
    super({
      controller: new BCDCpcController(),
      endpoint: "/bcd-cpcs",
      dtoCreateClass: BCDCpcDTO,
      dtoUpdateClass: UpdateBCDCpcDTO,
    });
  }
}
