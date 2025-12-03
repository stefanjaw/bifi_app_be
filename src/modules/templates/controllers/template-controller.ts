import { TemplateDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { TemplateService } from "../services/template-service";

const templateService = new TemplateService();

export class TemplateController extends BaseController<TemplateDocument> {
  constructor() {
    super({
      service: templateService,
    });
  }
}
