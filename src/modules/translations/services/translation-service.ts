import { BaseService, runTransaction } from "../../../system";
import { ClientSession } from "mongoose";
import {
  translationModel,
  TranslationDocument,
} from "../models/translation.model";
import { CreateTranslationDTO } from "../models/translation.dto";

/** Maximum number of {locale, scope, key} filters per $or chunk */
const REQUERY_CHUNK_SIZE = 500;

/** Normalized shape of a validated CSV row used for the upsert */
interface ImportRow {
  locale: string;
  scope: string;
  key: string;
  value: string;
  active?: boolean;
}

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

  /**
   * Imports translations from CSV rows, upserting instead of inserting so an
   * upload never crashes on the unique {locale, scope, key} index:
   * - a key+language that already exists has its value (and active flag, when
   *   provided) updated;
   * - a key+language that does not exist is created (active defaults to true);
   * - duplicated rows within the same file are collapsed, the last row wins.
   * @param data - The validated CSV rows.
   * @param session - The optional client session to use for the transaction.
   * @returns The affected translation documents, re-queried after the write.
   */
  override async importCSV(
    data: Record<string, unknown>[],
    session?: ClientSession,
  ): Promise<TranslationDocument[]> {
    return runTransaction<TranslationDocument[]>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        // Collapse duplicated keys within the file — the unique index would
        // otherwise reject two rows sharing the same {locale, scope, key}.
        // Rows are mapped explicitly (no casts) since the CSV middleware has
        // already validated them against CreateTranslationDTO.
        const unique = new Map<string, ImportRow>();
        for (const row of data) {
          const mapped: ImportRow = {
            locale: String(row.locale),
            scope: String(row.scope),
            key: String(row.key),
            value: String(row.value),
            ...(row.active !== undefined ? { active: Boolean(row.active) } : {}),
          };
          unique.set(`${mapped.locale}|${mapped.scope}|${mapped.key}`, mapped);
        }
        const rows = [...unique.values()];

        // Find which pairs already exist so the write phase can (a) skip the
        // upsert flag for updates and (b) apply the active default explicitly
        // on creates — bulkWrite does not support setDefaultsOnInsert.
        const existingKeys = new Set<string>();
        for (let i = 0; i < rows.length; i += REQUERY_CHUNK_SIZE) {
          const chunk = rows
            .slice(i, i + REQUERY_CHUNK_SIZE)
            .map((row) => ({
              locale: row.locale,
              scope: row.scope,
              key: row.key,
            }));
          const docs = await model
            .find({ $or: chunk })
            .select("locale scope key")
            .session(newSession);
          for (const doc of docs) {
            existingKeys.add(`${doc.locale}|${doc.scope}|${doc.key}`);
          }
        }

        const operations = rows.map((row) => {
          const rowKey = `${row.locale}|${row.scope}|${row.key}`;
          const isExisting = existingKeys.has(rowKey);

          return {
            updateOne: {
              filter: { locale: row.locale, scope: row.scope, key: row.key },
              update: {
                $set: {
                  value: row.value,
                  // Rows without an active column keep the current flag on
                  // updates; new rows default to active.
                  ...(row.active !== undefined
                    ? { active: row.active }
                    : isExisting
                      ? {}
                      : { active: true }),
                },
              },
              upsert: !isExisting,
            },
          };
        });

        await model.bulkWrite(operations, { session: newSession });

        // Re-query the affected pairs so the response carries the stored
        // documents (with their _id), matching the BaseService contract.
        const imported: TranslationDocument[] = [];
        for (let i = 0; i < rows.length; i += REQUERY_CHUNK_SIZE) {
          const chunk = rows
            .slice(i, i + REQUERY_CHUNK_SIZE)
            .map((row) => ({
              locale: row.locale,
              scope: row.scope,
              key: row.key,
            }));
          const docs = await model.find({ $or: chunk }).session(newSession);
          imported.push(...docs);
        }

        return imported;
      },
    );
  }
}
