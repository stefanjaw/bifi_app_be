import { BCDDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDController } from "../controllers/bcd-controller";
import { BcdDTO, UpdateBcdDTO } from "../models/bcd.dto";

export class BCDRouter extends BaseRoutes<BCDDocument> {
  constructor() {
    super({
      controller: new BCDController(),
      endpoint: "/bcds",
      dtoCreateClass: BcdDTO,
      dtoUpdateClass: UpdateBcdDTO,
    });
  }
}
