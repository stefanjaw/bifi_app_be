import { UserDocument } from "@mongodb-types";
import {
  BaseController,
  FileValidatorService,
  runTransaction,
  UserStore,
} from "../../../system";
import { UserService } from "../services/user-service";
import { NextFunction, Request, Response } from "express";

const userService = new UserService();

export class UserController extends BaseController<UserDocument> {
  fileValidator = new FileValidatorService();

  constructor() {
    super({ service: userService });
  }

  // overrides
  protected override async updateHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const photo = (req.files as Express.Multer.File[] | undefined)?.[0];

    if (photo) {
      try {
        this.fileValidator.validateImageFile(photo);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.uploadedPictureId = photo;
    }

    await super.updateHandler(req, res, next);
  }

  // custom controller for profile
  protected async updateProfileHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const photo = (req.files as Express.Multer.File[] | undefined)?.[0];

    if (photo) {
      try {
        this.fileValidator.validateImageFile(photo);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.uploadedPictureId = photo;
    }

    try {
      const profile = await userService.updateProfile(req.body);
      this.sendData(res, profile);
    } catch (error) {
      next(error);
    }
  }

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    await this.updateProfileHandler(req, res, next);
  };

  // custom controller for me handler
  protected async meHandler(req: Request, res: Response) {
    this.sendData(res, UserStore.getInstance().user);
  }

  me = async (req: Request, res: Response) => {
    await this.meHandler(req, res);
  };
}
