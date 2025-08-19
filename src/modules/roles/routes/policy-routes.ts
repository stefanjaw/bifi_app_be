import { PolicyDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { PolicyController } from "../controllers/policy-controller";
import { PolicyDTO, UpdatePolicyDTO } from "../models/policy.dto";

const policyController = new PolicyController();

export class PolicyRouter extends BaseRoutes<PolicyDocument> {
  constructor() {
    super({
      controller: policyController,
      endpoint: "/policies",
      dtoCreateClass: PolicyDTO,
      dtoUpdateClass: UpdatePolicyDTO,
    });
  }
}
