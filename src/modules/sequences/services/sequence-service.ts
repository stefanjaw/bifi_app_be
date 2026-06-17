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

  async getNextNumberOrCreate(
    name: string,
    prefix: string,
    size = 5,
    step = 1
  ): Promise<string> {
    const model = this.connectionManager.bindModelToDb(this.model);

    // Try to increment an existing active sequence and return the old value
    const existing = await model.findOneAndUpdate(
      { prefix, active: true },
      { $inc: { number: step } },
      { new: false }
    );

    if (existing) {
      const formatted = existing.number.toString().padStart(existing.size, "0");
      return `${existing.prefix}${formatted}${existing.suffix ?? ""}`;
    }

    // No sequence exists yet — create one; first project gets number 1
    // Store number=2 so the next call returns 2 correctly via the path above
    try {
      await model.create({ name, prefix, size, step, number: 1 + step, active: true });
    } catch {
      // Race condition: another request may have created it simultaneously; just use it
      const seq = await model.findOneAndUpdate(
        { prefix, active: true },
        { $inc: { number: step } },
        { new: false }
      ) as unknown as SequenceDocument | null;
      if (seq) {
        const formatted = seq.number.toString().padStart(seq.size, "0");
        return `${seq.prefix}${formatted}${seq.suffix ?? ""}`;
      }
    }

    const firstFormatted = (1).toString().padStart(size, "0");
    return `${prefix}${firstFormatted}`;
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

  async getNextCounterByName(name: string): Promise<string> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const seq = await model.findOneAndUpdate(
      { name, active: true },
      [{ $set: { number: { $add: ["$number", "$step"] } } }],
      { new: false }
    );

    if (!seq) {
      throw new NotFoundException(
        `No active sequence found for name "${name}". Please configure it in Accounting → Sequences before submitting.`
      );
    }

    return seq.number.toString().padStart(seq.size, "0");
  }
}
