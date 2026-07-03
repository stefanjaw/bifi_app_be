import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { DriveSettingsController } from "../controllers/drive-settings-controller";
import { DriveSettingsDTO } from "../models/drive-settings.dto";
import { DriveSettingsDocument } from "../models/drive-settings.model";

const driveSettingsController = new DriveSettingsController();

export class DriveSettingsRouter extends BaseRoutes<DriveSettingsDocument> {
  constructor() {
    super({
      controller: driveSettingsController,
      endpoint: "/drive-settings",
      dtoCreateClass: DriveSettingsDTO,
      dtoUpdateClass: DriveSettingsDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/drive-settings",
      authorizeMiddleware("drive-settings", "read"),
      driveSettingsController.getSettings,
    );

    this.router.put(
      "/drive-settings",
      authorizeMiddleware("drive-settings", "update"),
      validateBodyMiddleware(DriveSettingsDTO),
      driveSettingsController.upsertSettings,
    );
  }
}
