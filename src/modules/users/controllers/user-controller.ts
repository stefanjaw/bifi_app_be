import { UserDocument } from "@mongodb-types";
import { BaseController, runTransaction, UserStore } from "../../../system";
import { UserService } from "../services/user-service";
import { Request, Response } from "express";

const userService = new UserService();

export class UserController extends BaseController<UserDocument> {
  constructor() {
    super({ service: userService });
  }

  async meHandler(req: Request, res: Response) {
    this.sendData(res, UserStore.getInstance().user);
  }

  me = async (req: Request, res: Response) => {
    await this.meHandler(req, res);
  };
}
