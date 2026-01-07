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

  /**
   * Initializes the GET /{endpoint} route.
   * This route calls the `get` method of the controller and returns a list of records.
   */
  protected override initGetRoute(): void {
    this.router.get(this.endpoint, this.controller.get);
  }
}
