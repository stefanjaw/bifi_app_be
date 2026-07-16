import { BaseRoutes } from "../../../system";
import { MaritalStatusController } from "../controllers/marital-status-controller";
import {
  MaritalStatusDTO,
  UpdateMaritalStatusDTO,
} from "../models/marital-status.dto";

const maritalStatusController = new MaritalStatusController();

/** Route definitions for marital status endpoints */
export class MaritalStatusRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: maritalStatusController,
      endpoint: "/marital-statuses",
      dtoCreateClass: MaritalStatusDTO,
      dtoUpdateClass: UpdateMaritalStatusDTO,
    });
  }
}
