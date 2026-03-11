import { BaseService } from "../../../system";
import { NotFoundException } from "../../../system/libraries/exceptions/service-exception";
import { sequenceModel, SequenceDocument } from "../models/sequence.model";

export class SequenceService extends BaseService<SequenceDocument> {
  constructor() {
    super({
      model: sequenceModel,
    });
  }

  async getNextNumber(prefix: string): Promise<string> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const seq = await model.findOneAndUpdate(
      { prefix, active: true },
      { $inc: { number: 1 } },
      { new: false }
    );

    if (!seq) {
      throw new NotFoundException(
        `No active sequence found for prefix "${prefix}"`
      );
    }

    const formatted = seq.number.toString().padStart(seq.size, "0");
    return `${seq.prefix}${formatted}${seq.suffix ?? ""}`;
  }

  async getNextNumberById(id: string): Promise<string> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const seq = await model.findOneAndUpdate(
      { _id: id, active: true },
      { $inc: { number: 1 } },
      { new: false }
    );

    if (!seq) {
      throw new NotFoundException(
        `No active sequence found for id "${id}"`
      );
    }

    const formatted = seq.number.toString().padStart(seq.size, "0");
    return `${seq.prefix}${formatted}${seq.suffix ?? ""}`;
  }
}
