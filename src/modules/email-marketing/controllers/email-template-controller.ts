import { BaseController } from "../../../system";
import { EmailTemplateDocument } from "../models/email-template.model";
import { EmailTemplateService } from "../services/email-template-service";

const emailTemplateService = new EmailTemplateService();

export class EmailTemplateController extends BaseController<EmailTemplateDocument> {
  constructor() {
    super({ service: emailTemplateService });
  }
}
