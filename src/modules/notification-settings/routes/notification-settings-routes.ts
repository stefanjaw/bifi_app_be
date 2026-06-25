import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { NotificationEventSettingsController } from "../controllers/notification-settings-controller";
import { UpdateNotificationSettingsDTO } from "../models/notification-settings.dto";
import { NotificationEventSettingsDocument } from "../models/notification-settings.model";

const notificationSettingsController =
  new NotificationEventSettingsController();

export class NotificationSettingsRouter extends BaseRoutes<NotificationEventSettingsDocument> {
  constructor() {
    super({
      controller: notificationSettingsController,
      endpoint: "/notification-settings",
      dtoCreateClass: UpdateNotificationSettingsDTO,
      dtoUpdateClass: UpdateNotificationSettingsDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/notification-settings/catalog",
      authorizeMiddleware("notification-settings", "read"),
      notificationSettingsController.getCatalog
    );

    this.router.get(
      "/notification-settings",
      authorizeMiddleware("notification-settings", "read"),
      notificationSettingsController.getSettings
    );

    this.router.put(
      "/notification-settings",
      authorizeMiddleware("notification-settings", "update"),
      validateBodyMiddleware(UpdateNotificationSettingsDTO),
      notificationSettingsController.upsertSettings
    );
  }
}
