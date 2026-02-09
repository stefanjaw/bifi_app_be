import { BCDPortDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDPortController } from "../controllers/bcd-port-controller";
import { BCDPortDTO, UpdateBCDPortDTO } from "../models/bcd-port.dto";

export class BCDPortRouter extends BaseRoutes<BCDPortDocument> {
  constructor() {
    super({
      controller: new BCDPortController(),
      endpoint: "/bcd-ports",
      dtoCreateClass: BCDPortDTO,
      dtoUpdateClass: UpdateBCDPortDTO,
    });
  }
}
