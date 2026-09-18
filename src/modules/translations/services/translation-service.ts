import { BaseService } from "../../../system";
import {
  translationModel,
  TranslationDocument,
} from "../models/translation.model";
import { CreateTranslationDTO } from "../models/translation.dto";

export class TranslationService extends BaseService<TranslationDocument> {
  constructor() {
    super({
      model: translationModel,
    });
  }

  /**
   * Retrieves all translations for a given locale and scope.
   * @param locale - The locale string (e.g. "en", "es").
   * @param scope - The translation scope (e.g. "common", "sales").
   * @returns A record of key-value pairs.
   */
  async getTranslations(
    locale: string,
    scope: string,
  ): Promise<Record<string, string>> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const docs = await model.find({ locale, scope, active: true }).lean();
    const result: Record<string, string> = {};
    for (const doc of docs) {
      result[doc.key] = doc.value;
    }
    return result;
  }

  /**
   * Creates or updates a single translation key.
   * Uses the unique index on { locale, scope, key } to upsert.
   * @param data - The translation data.
   * @returns The upserted translation document.
   */
  async upsertTranslation(
    data: CreateTranslationDTO,
  ): Promise<TranslationDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOneAndUpdate(
      { locale: data.locale, scope: data.scope, key: data.key },
      { $set: { value: data.value } },
      { upsert: true, new: true },
    );
  }

  /**
   * Deletes all translations matching a given locale and scope.
   * @param locale - The locale to delete.
   * @param scope - The scope to delete.
   */
  async deleteScope(locale: string, scope: string): Promise<void> {
    const model = this.connectionManager.bindModelToDb(this.model);
    await model.deleteMany({ locale, scope });
  }
}
