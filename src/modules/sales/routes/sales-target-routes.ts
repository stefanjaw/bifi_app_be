import { BaseRoutes } from "../../../system";
import { SalesTargetDocument } from "@mongodb-types";
import { SalesTargetController } from "../controllers/sales-target-controller";
import {
  SalesTargetDTO,
  UpdateSalesTargetDTO,
} from "../models/sales-target.dto";

const salesTargetController = new SalesTargetController();

export class SalesTargetRouter extends BaseRoutes<SalesTargetDocument> {
  constructor() {
    super({
      controller: salesTargetController,
      endpoint: "/sales-targets",
      dtoCreateClass: SalesTargetDTO,
      dtoUpdateClass: UpdateSalesTargetDTO,
    });
  }
}
