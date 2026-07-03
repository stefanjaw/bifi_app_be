import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { TranslationController } from "../controllers/translation-controller";
import { TranslationDocument } from "../models/translation.model";
import {
  CreateTranslationDTO,
  UpdateTranslationDTO,
} from "../models/translation.dto";

const translationController = new TranslationController();

export class TranslationRouter extends BaseRoutes<TranslationDocument> {
  constructor() {
    super({
      controller: translationController,
      endpoint: "/translations",
      dtoCreateClass: CreateTranslationDTO,
      dtoUpdateClass: UpdateTranslationDTO,
    });
  }

  protected override initRoutes() {
    // Register custom scope endpoint BEFORE super.initRoutes() to ensure
    // Express matches "/translations/scope" instead of "/translations/:id"
    this.router.get(
      "/translations/scope",
      translationController.getTranslationsByScope,
    );

    // Standard CRUD routes for admin management (list, create, update, delete)
    super.initRoutes();
  }
}
