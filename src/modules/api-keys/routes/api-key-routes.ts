import { ApiKeyDocument } from "@mongodb-types";
import { authorizeMiddleware, BaseRoutes } from "../../../system";
import { ApiKeyController } from "../controllers/api-key-controller";
import { CreateApiKeyDTO, UpdateApiKeyDTO } from "../models/api-key.dto";

const apiKeyController = new ApiKeyController();

export class ApiKeyRouter extends BaseRoutes<ApiKeyDocument> {
  constructor() {
    super({
      controller: apiKeyController,
      endpoint: "/api-keys",
      dtoCreateClass: CreateApiKeyDTO,
      dtoUpdateClass: UpdateApiKeyDTO,
    });
  }

  /** Registers the renew/rotate action in addition to the standard CRUD routes. */
  override initRoutes(): void {
    this.initRenewRoute();
    super.initRoutes();
  }

  /**
   * Registers `POST /api-keys/:id/renew` — rotates a key's secret, resetting its
   * expiry. Guarded as an update-class action (self-scoped in the service).
   */
  initRenewRoute(): void {
    this.router.post(
      this.endpoint + "/:id/renew",
      authorizeMiddleware(this.resource, "update"),
      apiKeyController.renew,
    );
  }
}
