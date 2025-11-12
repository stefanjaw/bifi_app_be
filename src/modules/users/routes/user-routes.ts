import { UserDocument } from "@mongodb-types";
import {
  authorizeMiddleware,
  BaseRoutes,
  validateBodyMiddleware,
} from "../../../system";
import { UserController } from "../controllers/user-controller";
import { UpdateUserDTO, UserDTO } from "../models/user.dto";

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
    this.initPutProfileRoute();
    super.initRoutes();
  }

  initMeRoute() {
    this.router.get(this.endpoint + "/me", userController.me);
  }

  initPutProfileRoute(): void {
    this.router.put(
      this.endpoint + "/profile",
      this.upload.any(),
      validateBodyMiddleware(this.dtoUpdateClass),
      authorizeMiddleware(this.resource + "/profile", "update"),
      userController.updateProfile
    );
  }
}
