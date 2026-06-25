import { BaseRoutes } from "../../../system";
import { EmailEventController } from "../controllers/email-event-controller";
import { EmailEventDTO, UpdateEmailEventDTO } from "../models/email-event.dto";
import { EmailEventDocument } from "../models/email-event.model";

const emailEventController = new EmailEventController();

export class EmailEventRouter extends BaseRoutes<EmailEventDocument> {
  constructor() {
    super({
      controller: emailEventController,
      endpoint: "/email-events",
      dtoCreateClass: EmailEventDTO,
      dtoUpdateClass: UpdateEmailEventDTO,
    });
  }
}
