import mongoose, { ClientSession } from "mongoose";
import { CRMDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { crmModel } from "../models/crm.model";
import { fireNotification } from "../../notifications/services/notification-service";

export class CRMService extends BaseService<CRMDocument> {
  constructor() {
    super({
      model: crmModel,
      refFields: [
        {
          path: "stage",
          getModel: () => mongoose.model("CrmStage") as any,
          isArray: false,
        },
        {
          path: "contact",
          getModel: () => mongoose.model("Contact") as any,
          isArray: false,
        },
        {
          path: "company",
          getModel: () => mongoose.model("Company") as any,
          isArray: false,
        },
        {
          path: "owner",
          getModel: () => mongoose.model("User") as any,
          isArray: false,
        },
        {
          path: "salesperson",
          getModel: () => mongoose.model("User") as any,
          isArray: false,
        },
      ],
    });
  }

  override async update(
    data: Record<string, any>,
    session?: ClientSession,
  ): Promise<CRMDocument> {
    const dealId = (data as any)._id;
    const updated = await super.update(data, session);

    if (data.stage) {
      try {
        const stageModel = this.connectionManager.bindModelToDb(
          mongoose.model("CrmStage") as any,
        );
        const stage = await stageModel.findById(data.stage).lean();
        const stageName: string = (stage as any)?.name ?? "";
        if (stageName.toLowerCase().includes("won")) {
          const existing = await this.connectionManager
            .bindModelToDb(this.model)
            .findById(dealId)
            .lean();
          await fireNotification({
            type: "deal_won",
            context: {
              salesperson: (existing as any)?.salesperson,
              owner: (existing as any)?.owner,
            },
            title: "CRM Deal Won",
            body: `Deal "${
              (existing as any)?.title ?? dealId
            }" has been marked as Won.`,
            link: `/sales/opportunities/edit/${dealId}`,
            module: "sales",
          });
        }
      } catch {
        // non-fatal — notification failure must never break the update
      }
    }

    return updated;
  }
}
