import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware, validateBodyMiddleware } from "../../../system";
import { UserShortcutsController } from "../controllers/user-shortcuts-controller";
import { UserShortcutsDTO } from "../models/user-shortcuts.dto";
import { UserShortcutsDocument } from "../models/user-shortcuts.model";

const userShortcutsController = new UserShortcutsController();

export class UserShortcutsRouter extends BaseRoutes<UserShortcutsDocument> {
  constructor() {
    super({
      controller: userShortcutsController,
      endpoint: "/user-shortcuts",
      dtoCreateClass: UserShortcutsDTO,
      dtoUpdateClass: UserShortcutsDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/user-shortcuts/me",
      authorizeMiddleware(this.resource, "read"),
      userShortcutsController.getMyShortcuts,
    );

    this.router.put(
      "/user-shortcuts/me",
      this.upload.any(),
      validateBodyMiddleware(UserShortcutsDTO),
      authorizeMiddleware(this.resource, "update"),
      userShortcutsController.upsertMyShortcuts,
    );
  }
}
