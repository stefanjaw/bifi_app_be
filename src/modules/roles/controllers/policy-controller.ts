import { PolicyDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { PolicyService } from "../services/policy-service";

const policyService = new PolicyService();

export class PolicyController extends BaseController<PolicyDocument> {
  constructor() {
    super({ service: policyService });
  }
}
