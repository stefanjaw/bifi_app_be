import { UserDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { UserService } from "../services/user-service";
import { Request, Response } from "express";

const userService = new UserService();

export class UserController extends BaseController<UserDocument> {
  constructor() {
    super({ service: userService });
  }

  meHandler(req: Request, res: Response) {
    return req.user;
  }

  me = (req: Request, res: Response) => {
    this.meHandler(req, res);
  };
}
