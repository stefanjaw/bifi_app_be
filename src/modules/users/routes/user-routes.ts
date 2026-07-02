import { UserDocument } from "@mongodb-types";
import { BaseRoutes, validateBodyMiddleware } from "../../../system";
import { UserController } from "../controllers/user-controller";
import {
  UpdateUserLanguageDTO,
  UpdateUserDTO,
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
      userController.updateLanguage
    );
  }

  // !!! wont have authorization, all users can update their profile
  initGetProfileRoute(): void {
    this.router.get(this.endpoint + "/profile/", userController.getProfile);
  }

  initPutProfileRoute(): void {
    this.router.put(
      this.endpoint + "/profile",
      this.upload.any(),
      validateBodyMiddleware(this.dtoUpdateClass),
      userController.updateProfile
    );
  }
}
