import { UserDocument } from "@mongodb-types";
import {
  BaseController,
  FileValidatorService,
  userStorage,
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

  /**
   * Extends the base update handler to validate and attach an uploaded profile photo
   * before delegating to the parent.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
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

  /**
   * Handles profile update for the currently logged-in user.
   * Validates and attaches a profile photo if provided, then delegates to UserService.updateProfile.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  protected async updateProfileHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
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

  /**
   * Express handler — delegates to updateProfileHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    await this.updateProfileHandler(req, res, next);
  };

  /**
   * Handles fetching the profile of the currently logged-in user by ID.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  protected async getProfileHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId = userStorage.getStore()?.user?._id.toString();
    this.sendData(res, await this.service.getById(userId || "", undefined));
  }

  /**
   * Express handler — delegates to getProfileHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  getProfile = (req: Request, res: Response, next: NextFunction) => {
    this.getProfileHandler(req, res, next);
  };

  /**
   * Handles returning the currently authenticated user from the request context (userStorage).
   * @param req - The express Request object.
   * @param res - The express Response object.
   */
  protected async meHandler(req: Request, res: Response) {
    this.sendData(res, userStorage.getStore()?.user);
  }

  /**
   * Express handler — delegates to meHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   */
  me = async (req: Request, res: Response) => {
    await this.meHandler(req, res);
  };
}
