import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { TranslationService } from "../services/translation-service";
import { TranslationDocument } from "../models/translation.model";

export class TranslationController extends BaseController<TranslationDocument> {
  constructor() {
    super({ service: new TranslationService() });
  }

  /**
   * Express handler — returns all translations for a locale and scope as a key-value record.
   * Query params: locale (required), scope (required).
   */
  getTranslationsByScope = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const locale = req.query.locale as string;
      const scope = req.query.scope as string;

      if (!locale || !scope) {
        res
          .status(400)
          .json({ error: "locale and scope query params are required" });
        return;
      }

      const translations = await (
        this.service as TranslationService
      ).getTranslations(locale, scope);

      res.json(translations);
    } catch (error) {
      next(error);
    }
  };
}
