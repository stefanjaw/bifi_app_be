import { PolicyDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { policyModel } from "../models/policy.model";

export class PolicyService extends BaseService<PolicyDocument> {
  constructor() {
    super({ model: policyModel });
  }
}
