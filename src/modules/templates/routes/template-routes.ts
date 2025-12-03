import { TemplateDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { TemplateController } from "../controllers/template-controller";
import { TemplateDTO, UpdateTemplateDTO } from "../models/template.dto";

const templateController = new TemplateController();

export class TemplateRouter extends BaseRoutes<TemplateDocument> {
  constructor() {
    super({
      controller: templateController,
      endpoint: "/templates",
      dtoCreateClass: TemplateDTO,
      dtoUpdateClass: UpdateTemplateDTO,
    });
  }
}
