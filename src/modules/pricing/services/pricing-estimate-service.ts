import { ClientSession } from "mongoose";
import { BaseService, ValidationException } from "../../../system";
import {
  pricingEstimateModel,
  PricingEstimateDocument,
} from "../models/pricing-estimate.model";
import { PricingSettingsService } from "./pricing-settings-service";
import { SequenceService } from "../../sequences/services/sequence-service";

const pricingSettingsService = new PricingSettingsService();
const sequenceService = new SequenceService();

export class PricingEstimateService extends BaseService<PricingEstimateDocument> {
  constructor() {
    super({ model: pricingEstimateModel });
  }

  override async create(
    data: Record<string, unknown>,
    session: ClientSession | undefined = undefined,
  ): Promise<PricingEstimateDocument> {
    const settings = await pricingSettingsService.getSettings();
    const estimateSequence = settings?.estimateSequence as
      | Record<string, unknown>
      | string
      | undefined;

    if (!estimateSequence) {
      throw new ValidationException(
        "Estimate sequence is not configured. Please set an estimate sequence in Pricing Settings before creating estimates.",
      );
    }

    const seqId =
      typeof estimateSequence === "object" && estimateSequence._id
        ? String(estimateSequence._id)
        : String(estimateSequence);
    data.number = await sequenceService.getNextNumberById(seqId);

    return super.create(data, session);
  }
}
