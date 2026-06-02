import { BaseService } from "../../../system";
import {
  emailTemplateModel,
  EmailTemplateDocument,
} from "../models/email-template.model";

export class EmailTemplateService extends BaseService<EmailTemplateDocument> {
  constructor() {
    super({
      model: emailTemplateModel,
    });
  }
}
