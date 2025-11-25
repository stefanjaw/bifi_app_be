import { CRMDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { crmModel } from "../models/crm.model";

export class CRMService extends BaseService<CRMDocument> {
  constructor() {
    super({ model: crmModel });
  }
}
