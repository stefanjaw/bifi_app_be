import { NextFunction, Request, Response } from "express";
import { BaseController, FileValidatorService } from "../../../system";
import { ContactDocument } from "../../../types/mongoose.gen";
import { ContactService } from "../services/contact-service";

const contactService = new ContactService();

export class ContactController extends BaseController<ContactDocument> {
  fileValidator = new FileValidatorService();

  constructor() {
    super({ service: contactService });
  }

  protected override async createHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const files = req.files as { photo?: Express.Multer.File[] } | undefined;

    const photo = files?.photo?.[0];

    if (photo) {
      try {
        this.fileValidator.validateImageFile(photo);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.photo = photo;
    }

    await super.createHandler(req, res, next);
  }

  protected override async updateHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const files = req.files as { photo?: Express.Multer.File[] } | undefined;

    const photo = files?.photo?.[0];

    if (photo) {
      try {
        this.fileValidator.validateImageFile(photo);
      } catch (error: any) {
        next(error);
        return;
      }

      req.body.photo = photo;
    }

    await super.updateHandler(req, res, next);
  }
}
