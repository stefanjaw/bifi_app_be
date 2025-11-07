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

  private acceptedAttarchmentTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ];

  constructor() {
    super({ service: userService });
  }

  async meHandler(req: Request, res: Response) {
    this.sendData(res, UserStore.getInstance().user);
  }

  me = async (req: Request, res: Response) => {
    await this.meHandler(req, res);
  };

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
}
