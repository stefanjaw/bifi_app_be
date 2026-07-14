import { BCDChargeCodeDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDChargeCodeController } from "../controllers/bcd-charge.code-controller";
import {
  BCDChargeCodeDTO,
  UpdateBCDChargeCodeDTO,
} from "../models/bcd-charge-code.dto";

export class BCDChargeCodeRouter extends BaseRoutes<BCDChargeCodeDocument> {
  constructor() {
    super({
      controller: new BCDChargeCodeController(),
      endpoint: "/bcd-charge-codes",
      dtoCreateClass: BCDChargeCodeDTO,
      dtoUpdateClass: UpdateBCDChargeCodeDTO,
    });
  }
}
