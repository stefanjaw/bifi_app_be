import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { LanguageController } from "../controllers/language-controller";
import { LanguageDocument } from "../models/language.model";
import { CreateLanguageDTO, UpdateLanguageDTO } from "../models/language.dto";

const languageController = new LanguageController();

/**
 * Router for Language CRUD endpoints mounted at /languages.
 */
export class LanguageRouter extends BaseRoutes<LanguageDocument> {
  constructor() {
    super({
      controller: languageController,
      endpoint: "/languages",
      dtoCreateClass: CreateLanguageDTO,
      dtoUpdateClass: UpdateLanguageDTO,
    });
  }
}
