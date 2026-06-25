import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { UserShortcutsService } from "../services/user-shortcuts-service";
import { UserShortcutsDTO } from "../models/user-shortcuts.dto";
import { UserShortcutsDocument } from "../models/user-shortcuts.model";
import { userStorage } from "../../../system";

export class UserShortcutsController extends BaseController<UserShortcutsDocument> {
  constructor() {
    super({ service: new UserShortcutsService() });
  }

  getMyShortcuts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = userStorage.getStore()?.user;
      if (!user) {
        this.sendData(res, { shortcuts: [] });
        return;
      }
      const doc = await (this.service as UserShortcutsService).getMyShortcuts(
        user._id
      );
      this.sendData(res, doc ?? { shortcuts: [] });
    } catch (error) {
      next(error);
    }
  };

  upsertMyShortcuts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = userStorage.getStore()?.user;
      if (!user) {
        this.sendData(res, { shortcuts: [] });
        return;
      }
      const data = req.body as UserShortcutsDTO;
      const result = await (
        this.service as UserShortcutsService
      ).upsertMyShortcuts(user._id, data.shortcuts ?? []);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
