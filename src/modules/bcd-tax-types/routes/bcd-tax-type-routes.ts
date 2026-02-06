import { BCDTaxTypeDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDTaxTypeController } from "../controllers/bcd-tax-type-controller";
import { BCDTaxTypeDTO, UpdateBCDTaxTypeDTO } from "../models/bcd-tax-type.dto";

export class BCDTaxTypeRouter extends BaseRoutes<BCDTaxTypeDocument> {
  constructor() {
    super({
      controller: new BCDTaxTypeController(),
      endpoint: "/bcd-tax-types",
      dtoCreateClass: BCDTaxTypeDTO,
      dtoUpdateClass: UpdateBCDTaxTypeDTO,
    });
  }
}
