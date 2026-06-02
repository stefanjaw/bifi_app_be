import { BaseRoutes } from "../../../system";
import { EmailTemplateController } from "../controllers/email-template-controller";
import {
  EmailTemplateDTO,
  UpdateEmailTemplateDTO,
} from "../models/email-template.dto";
import { EmailTemplateDocument } from "../models/email-template.model";

const emailTemplateController = new EmailTemplateController();

export class EmailTemplateRouter extends BaseRoutes<EmailTemplateDocument> {
  constructor() {
    super({
      controller: emailTemplateController,
      endpoint: "/email-templates",
      dtoCreateClass: EmailTemplateDTO,
      dtoUpdateClass: UpdateEmailTemplateDTO,
    });
  }
}
