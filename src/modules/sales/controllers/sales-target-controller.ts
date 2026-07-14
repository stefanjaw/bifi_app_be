import { BaseController } from "../../../system";
import { SalesTargetDocument } from "@mongodb-types";
import { SalesTargetService } from "../services/sales-target-service";

const salesTargetService = new SalesTargetService();

export class SalesTargetController extends BaseController<SalesTargetDocument> {
  constructor() {
    super({ service: salesTargetService });
  }
}
