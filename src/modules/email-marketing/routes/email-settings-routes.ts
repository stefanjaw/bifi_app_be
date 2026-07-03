import { BaseRoutes } from "../../../system";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { EmailSettingsController } from "../controllers/email-settings-controller";
import { EmailSettingsDTO } from "../models/email-settings.dto";
import { EmailSettingsDocument } from "../models/email-settings.model";

const emailSettingsController = new EmailSettingsController();

export class EmailSettingsRouter extends BaseRoutes<EmailSettingsDocument> {
  constructor() {
    super({
      controller: emailSettingsController,
      endpoint: "/email-settings",
      dtoCreateClass: EmailSettingsDTO,
      dtoUpdateClass: EmailSettingsDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/email-settings",
      authorizeMiddleware("email-settings", "read"),
      emailSettingsController.getSettings,
    );

    this.router.put(
      "/email-settings",
      authorizeMiddleware("email-settings", "update"),
      validateBodyMiddleware(EmailSettingsDTO),
      emailSettingsController.upsertSettings,
    );

    this.router.post(
      "/email-settings/test-connection",
      authorizeMiddleware("email-settings", "read"),
      emailSettingsController.testConnection,
    );
  }
}
