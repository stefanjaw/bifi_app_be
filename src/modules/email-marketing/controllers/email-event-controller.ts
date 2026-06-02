import { BaseController } from "../../../system";
import { EmailEventDocument } from "../models/email-event.model";
import { EmailEventService } from "../services/email-event-service";

const emailEventService = new EmailEventService();

export class EmailEventController extends BaseController<EmailEventDocument> {
  constructor() {
    super({ service: emailEventService });
  }
}
