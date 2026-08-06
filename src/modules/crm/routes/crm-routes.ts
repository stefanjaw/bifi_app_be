import { CRMDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { CRMController } from "../controllers/crm-controller";
import { CRMDTO, UpdateCRMDTO } from "../models/crm.dto";

const crmController = new CRMController();

export class CRMRouter extends BaseRoutes<CRMDocument> {
  constructor() {
    super({
      controller: crmController,
      endpoint: "/crm",
      dtoCreateClass: CRMDTO,
      dtoUpdateClass: UpdateCRMDTO,
    });
    this.resource = "sales/opportunities";
  }
}
