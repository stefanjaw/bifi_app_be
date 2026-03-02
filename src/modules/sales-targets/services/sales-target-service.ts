import { BaseService } from "../../../system";
import { SalesTargetDocument } from "@mongodb-types";
import { salesTargetModel } from "../models/sales-target.model";

export class SalesTargetService extends BaseService<SalesTargetDocument> {
  constructor() {
    super({ model: salesTargetModel });
  }
}
