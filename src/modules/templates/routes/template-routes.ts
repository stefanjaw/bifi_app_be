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

  // INTENTIONALLY PUBLIC: GET /templates is listed in `ignoreEndpoints` in
  // authenticate-middleware.ts because the frontend prebuild script
  // (tools/prebuild/prebuild.ts) fetches templates without an auth token.
  // The substring-bypass vulnerability (H1) is fixed via exact path matching
  // in the middleware — only GET /api/templates (exact) bypasses auth, not
  // arbitrary paths containing "/templates". If prebuild is updated to pass
  // a service token, remove this override and the ignoreEndpoints entry.
  protected override initGetRoute(): void {
    this.router.get(this.endpoint, this.controller.get);
  }
}
