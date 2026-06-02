import { BaseService } from "../../../system";
import {
  emailEventModel,
  EmailEventDocument,
} from "../models/email-event.model";

export class EmailEventService extends BaseService<EmailEventDocument> {
  constructor() {
    super({
      model: emailEventModel,
    });
  }

  async record(data: Partial<EmailEventDocument>): Promise<EmailEventDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return (await model.create([data]))[0];
  }
}
