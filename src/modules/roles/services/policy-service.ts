import { PolicyDocument } from "@mongodb-types";
import { BaseService, runTransaction } from "../../../system";
import { policyModel } from "../models/policy.model";
import { ClientSession } from "mongoose";

export class PolicyService extends BaseService<PolicyDocument> {
  constructor() {
    super({ model: policyModel });
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<PolicyDocument> {
    return await runTransaction<PolicyDocument>(session, async (newSession) => {
      // check that no other policy exists with the same resource and action
      const existingPolicy = await this.model.findOne({
        resource: data.resource,
        action: data.action,
      });

      if (existingPolicy) {
        throw new Error(
          "A policy already exists for this resource and action."
        );
      }

      return await super.create(data, newSession);
    });
  }

  override async update(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<PolicyDocument> {
    return await runTransaction<PolicyDocument>(session, async (newSession) => {
      // check that no other policy exists with the same resource and action
      // do it removing the current policy
      const existingPolicy = await this.model.findOne({
        resource: data.resource,
        action: data.action,
        _id: { $ne: data._id }, // exclude the current policy
      });

      if (existingPolicy) {
        throw new Error(
          "A policy already exists for this resource and action."
        );
      }

      return await super.update(data, newSession);
    });
  }
}
