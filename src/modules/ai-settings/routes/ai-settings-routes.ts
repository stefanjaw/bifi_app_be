import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { AiSettingsController } from "../controllers/ai-settings-controller";
import { AiSettingsDTO } from "../models/ai-settings.dto";
import { AiSettingsDocument } from "../models/ai-settings.model";

const aiSettingsController = new AiSettingsController();

export class AiSettingsRouter extends BaseRoutes<AiSettingsDocument> {
  constructor() {
    super({
      controller: aiSettingsController,
      endpoint: "/ai-settings",
      dtoCreateClass: AiSettingsDTO,
      dtoUpdateClass: AiSettingsDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/ai-settings",
      authorizeMiddleware("ai-settings", "read"),
      aiSettingsController.getSettings
    );

    this.router.put(
      "/ai-settings",
      authorizeMiddleware("ai-settings", "update"),
      validateBodyMiddleware(AiSettingsDTO),
      aiSettingsController.upsertSettings
    );
  }
}
