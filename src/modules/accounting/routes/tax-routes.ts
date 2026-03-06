import { BaseRoutes } from "../../../system";
import { TaxDocument } from "../models/tax.model";
import { TaxController } from "../controllers/tax-controller";
import { TaxDTO, UpdateTaxDTO } from "../models/tax.dto";

const taxController = new TaxController();

export class TaxRouter extends BaseRoutes<TaxDocument> {
  constructor() {
    super({
      controller: taxController,
      endpoint: "/accounting/taxes",
      dtoCreateClass: TaxDTO,
      dtoUpdateClass: UpdateTaxDTO,
    });
  }
}
