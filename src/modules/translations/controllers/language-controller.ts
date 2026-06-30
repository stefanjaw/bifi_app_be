import { BaseController } from "../../../system/libraries/base-module/base-controller";
import { LanguageService } from "../services/language.service";
import { LanguageDocument } from "../models/language.model";

/**
 * Controller for Language CRUD operations.
 * Delegates to LanguageService for all data access.
 */
export class LanguageController extends BaseController<LanguageDocument> {
  constructor() {
    super({ service: new LanguageService() });
  }
}
