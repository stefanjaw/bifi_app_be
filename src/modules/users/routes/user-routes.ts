import { UserDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
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
    super.initRoutes();
  }

  initMeRoute() {
    this.router.get(this.endpoint + "/me", userController.me);
  }
}
