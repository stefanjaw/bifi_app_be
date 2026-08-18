import { UserDocument } from "@mongodb-types";
import { BaseRoutes, validateBodyMiddleware } from "../../../system";
import { UserController } from "../controllers/user-controller";
import {
  UpdateUserLanguageDTO,
  UpdateUserDTO,
  UpdateProfileDTO,
  UserDTO,
} from "../models/user.dto";

const userController = new UserController();

export class UserRouter extends BaseRoutes<UserDocument> {
  constructor() {
    super({
      controller: userController,
      endpoint: "/users",
      dtoCreateClass: UserDTO,
      dtoUpdateClass: UpdateUserDTO,
    });
  }

  override initRoutes(): void {
    this.initMeRoute();
    this.initMeLanguageRoute();
    this.initGetProfileRoute();
    this.initPutProfileRoute();
    super.initRoutes();
  }

  initMeRoute() {
    this.router.get(this.endpoint + "/me", userController.me);
  }

  initMeLanguageRoute() {
    this.router.put(
      this.endpoint + "/me/language",
      validateBodyMiddleware(UpdateUserLanguageDTO),
      userController.updateLanguage,
    );
  }

  // Self-scoped profile endpoints. Auth is enforced via the global
  // authenticateMiddleware (registered before routes in app.ts), and the
  // service-layer ownership check ensures a user can only touch their own
  // record. The dedicated UpdateProfileDTO prevents privilege-bearing fields
  // (roles, active, confirmed, authId, provider, email) from being submitted.
  initGetProfileRoute(): void {
    this.router.get(this.endpoint + "/profile/", userController.getProfile);
  }

  initPutProfileRoute(): void {
    this.router.put(
      this.endpoint + "/profile",
      this.upload.any(),
      validateBodyMiddleware(UpdateProfileDTO),
      userController.updateProfile,
    );
  }
}
