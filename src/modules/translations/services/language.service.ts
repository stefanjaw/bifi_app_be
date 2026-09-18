import { BaseService, runTransaction } from "../../../system";
import { ClientSession } from "mongoose";
import { languageModel, LanguageDocument } from "../models/language.model";

/** Maximum number of locale filters per $or chunk */
const REQUERY_CHUNK_SIZE = 500;

/** Normalized shape of a validated CSV row used for the upsert */
interface ImportRow {
  locale: string;
  name: string;
  nativeName: string;
  active?: boolean;
}

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

  /**
   * Imports languages from CSV rows, upserting instead of inserting so an
   * upload never crashes on the unique locale index:
   * - a locale that already exists has its name, nativeName (and active flag,
   *   when provided) updated;
   * - a locale that does not exist is created (active defaults to true);
   * - duplicated locales within the same file are collapsed, the last row wins.
   * @param data - The validated CSV rows.
   * @param session - The optional client session to use for the transaction.
   * @returns The affected language documents, re-queried after the write.
   */
  override async importCSV(
    data: Record<string, unknown>[],
    session?: ClientSession,
  ): Promise<LanguageDocument[]> {
    return runTransaction<LanguageDocument[]>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        // Collapse duplicated locales within the file — the unique index
        // would otherwise reject two rows sharing the same locale. Rows are
        // mapped explicitly (no casts) since the CSV middleware has already
        // validated them against CreateLanguageDTO.
        const unique = new Map<string, ImportRow>();
        for (const row of data) {
          const mapped: ImportRow = {
            locale: String(row.locale),
            name: String(row.name),
            nativeName: String(row.nativeName),
            ...(row.active !== undefined ? { active: Boolean(row.active) } : {}),
          };
          unique.set(mapped.locale, mapped);
        }
        const rows = [...unique.values()];

        // Find which locales already exist so the write phase can (a) skip
        // the upsert flag for updates and (b) apply the active default
        // explicitly on creates — bulkWrite does not support
        // setDefaultsOnInsert.
        const existingLocales = new Set<string>();
        for (let i = 0; i < rows.length; i += REQUERY_CHUNK_SIZE) {
          const chunk = rows
            .slice(i, i + REQUERY_CHUNK_SIZE)
            .map((row) => ({ locale: row.locale }));
          const docs = await model
            .find({ $or: chunk })
            .select("locale")
            .session(newSession);
          for (const doc of docs) {
            existingLocales.add(doc.locale);
          }
        }

        const operations = rows.map((row) => {
          const isExisting = existingLocales.has(row.locale);

          return {
            updateOne: {
              filter: { locale: row.locale },
              update: {
                $set: {
                  name: row.name,
                  nativeName: row.nativeName,
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

        // Re-query the affected locales so the response carries the stored
        // documents (with their _id), matching the BaseService contract.
        const imported: LanguageDocument[] = [];
        for (let i = 0; i < rows.length; i += REQUERY_CHUNK_SIZE) {
          const chunk = rows
            .slice(i, i + REQUERY_CHUNK_SIZE)
            .map((row) => ({ locale: row.locale }));
          const docs = await model.find({ $or: chunk }).session(newSession);
          imported.push(...docs);
        }

        return imported;
      },
    );
  }
}
