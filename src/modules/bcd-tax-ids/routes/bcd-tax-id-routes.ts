import { BCDTaxIdDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDTaxIdController } from "../controllers/bcd-tax-id-type";
import { BCDTaxIdDTO, UpdateBCDTaxIdDTO } from "../models/bcd-tax-id.dto";

export class BCDTaxIdRouter extends BaseRoutes<BCDTaxIdDocument> {
  constructor() {
    super({
      controller: new BCDTaxIdController(),
      endpoint: "/bcd-tax-ids",
      dtoCreateClass: BCDTaxIdDTO,
      dtoUpdateClass: UpdateBCDTaxIdDTO,
    });
  }
}
