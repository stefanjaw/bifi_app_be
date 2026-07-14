import { BCDTypeDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDTypeController } from "../controllers/bcd-type-controller";
import { BCDTypeDTO, UpdateBCDTypeDTO } from "../models/bcd-type.dto";

export class BCDTypeRouter extends BaseRoutes<BCDTypeDocument> {
  constructor() {
    super({
      controller: new BCDTypeController(),
      endpoint: "/bcd-types",
      dtoCreateClass: BCDTypeDTO,
      dtoUpdateClass: UpdateBCDTypeDTO,
    });
  }
}
