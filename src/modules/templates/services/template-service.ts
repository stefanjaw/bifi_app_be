import { TemplateDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { templateModel } from "../models/template.model";

export class TemplateService extends BaseService<TemplateDocument> {
  constructor() {
    super({ model: templateModel });
  }
}
