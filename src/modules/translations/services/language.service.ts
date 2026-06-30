import { BaseService } from "../../../system";
import {
  languageModel,
  LanguageDocument,
} from "../models/language.model";

/**
 * Service for managing Language records.
 * Provides standard CRUD operations inherited from BaseService.
 */
export class LanguageService extends BaseService<LanguageDocument> {
  constructor() {
    super({
      model: languageModel,
    });
  }
}
