import { PolicyDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { PolicyService } from "../services/policy-service";
import { Request, Response, NextFunction } from "express";

const policyService = new PolicyService();

export class PolicyController extends BaseController<PolicyDocument> {
  constructor() {
    super({ service: policyService });
  }

  protected override updateHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.body.conditions) req.body.conditions = [];

    return super.updateHandler(req, res, next);
  }
}
