import { ClientSession } from "mongoose";
import { BaseService } from "../../../system";
import { SalesOrderDocument } from "@mongodb-types";
import { salesOrderModel } from "../models/sales-order.model";
import { SalesSettingsService } from "../../sales/services/sales-settings-service";
import { SequenceService } from "../../sequences/services/sequence-service";

const salesSettingsService = new SalesSettingsService();
const sequenceService = new SequenceService();

export class SalesOrderService extends BaseService<SalesOrderDocument> {
  constructor() {
    super({ model: salesOrderModel });
  }

  override async create(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined
  ): Promise<SalesOrderDocument> {
    const settings = await salesSettingsService.getSettings();
    const orderSequence = settings?.orderSequence as any;
    if (orderSequence) {
      const seqId =
        typeof orderSequence === "object"
          ? orderSequence._id.toString()
          : orderSequence.toString();
      data.number = await sequenceService.getNextNumberById(seqId);
    }
    return super.create(data, session);
  }
}
