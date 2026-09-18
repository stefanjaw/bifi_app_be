import { orderByQuery, paginationOptions } from "./query-options.type";
import { runTransaction } from "./transaction-utils";
import { json2csv } from "json-2-csv";
import { refModelMap } from "./ref-model-map";
import { ConnectionManager } from "./connection-manager";
import mongoose, {
  ClientSession,
  Document,
  FilterQuery,
  PaginateModel,
} from "mongoose";
import { PaginateResult } from "mongoose";

/**
 * System fields that must never arrive through a mass-assignment update.
 * __v is managed by Mongoose versioning; timestamps by Mongoose plugins;
 * audit fields (createdBy, updatedBy) are set server-side by overrides;
 * active controls soft-delete via BaseService.delete(). (C6)
 */
const STRIP_FIELDS = ["__v", "createdAt", "updatedAt", "createdBy"] as const;

/**
 * Maximum number of filter clauses per $or query when checking for existing
 * documents during the CSV import upsert — keeps queries within Mongo limits
 * for very large files.
 */
const MAX_IMPORT_FILTER_CHUNK = 500;

export class BaseService<T extends Document> {
  protected connectionManager = new ConnectionManager();

  // Mongoose model
  model!: PaginateModel<T>;
  refFields?: refModelMap<T>[];

  constructor(params: Pick<BaseService<T>, "model" | "refFields">) {
    Object.assign(this, params);
  }

  //#region GET METHODS

  /**
   * Get a record by id.
   * @param {string} id - The id of the record to retrieve.
   * @param {ClientSession | undefined} session - The optional client session to use for the transaction.
   * @returns {Promise<T | undefined>} - A promise resolving to the retrieved record document, or undefined if no record exists.
   */
  async getById(
    id: string,
    session: ClientSession | undefined,
  ): Promise<T | undefined> {
    return await runTransaction<T | undefined>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);

      // return record by id
      const document = await model.findById(id).session(newSession); // This is a mongoose session
      return document as T | undefined;
    });
  }

  async get(
    searchParams: Record<string, any>,
    paginationOptions: undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined,
  ): Promise<T[]>;

  async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions & { paginate: true },
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined,
  ): Promise<PaginateResult<T>>;

  /**
   * Retrieves records from the database.
   * @param searchParams - The search params as key value pair.
   * @param paginationOptions - The pagination options with `paginate` set to `true` or `false`.
   * If `paginate` is `true`, the function will return a PaginateResult object with the records and pagination metadata.
   * If `paginate` is `false`, the function will return an array of records.
   * @param orderBy - The order by query.
   * If `orderBy` is provided, the function will use it to sort the records.
   * @param count - Whether to count the number of records.
   * If `count` is `true`, the function will return the count of records in the PaginateResult object.
   * If `count` is `false` or `undefined`, the function will not return the count of records.
   * @param dbName - The name of the database to use.
   * @param session - Optional mongoose session to use for the transaction.
   * @returns A promise resolving to a PaginateResult object if `paginate` is `true`, or an array of records if `paginate` is `false`.
   */
  async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions | undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    count: boolean | undefined,
    session: ClientSession | undefined = undefined,
  ): Promise<PaginateResult<T> | T[]> {
    return await runTransaction<PaginateResult<T> | T[]>(
      session,
      async (newSession) => {
        const model = this.connectionManager.bindModelToDb(this.model);

        if (this.refFields && this.refFields.length > 0) {
          searchParams = await this.transformReferenceFilters(
            searchParams,
            newSession,
          );
        }

        let records;

        // if orderBy sent by user, build the object
        let orderByObject: Record<string, any> | undefined = {};

        if (orderBy && orderBy.length > 0) {
          orderBy.forEach((item) => {
            orderByObject[item.field] = item.order === "asc" ? 1 : -1;
          });
        }

        if (paginationOptions && paginationOptions?.paginate) {
          // if paginated
          records = await model.paginate(searchParams, {
            page: paginationOptions.page,
            limit: paginationOptions.limit,
            session: newSession,
            sort: orderByObject,
          });
        } else if (count) {
          // count
          records = await model
            .countDocuments(searchParams)
            .session(newSession);
        } else {
          // non paginated
          records = orderByObject
            ? await model
                .find(searchParams)
                .session(newSession)
                .sort(orderByObject)
            : await model.find(searchParams).session(newSession);
        }

        return records as PaginateResult<T> | T[];
      },
    );
  }

  /**
   * Transforms filters that reference other models into MongoDB compatible filters.
   *
   * This function takes the given searchParams and recursively processes each key-value pair.
   * If the key corresponds to a configured reference, it extracts the actual field name,
   * finds the matching documents in the referenced model, and replaces the original filter with
   * an $in operator for arrays, or a single value for non-arrays.
   *
   * @param searchParams The search parameters to transform.
   * @param session The mongoose session to use for the transformation.
   * @returns A promise resolving to the transformed search parameters.
   */
  protected async transformReferenceFilters(
    searchParams: Record<string, any>,
    session: ClientSession,
  ) {
    // Make a deep copy to avoid mutating the original object
    const newFilters = Array.isArray(searchParams)
      ? [...searchParams]
      : { ...searchParams };

    // Recursive function to process filters
    const processObject = async (obj: any) => {
      if (Array.isArray(obj)) {
        // If the object is an array ($or/$and), process each element recursively
        for (let i = 0; i < obj.length; i++) {
          obj[i] = await processObject(obj[i]);
        }
      } else if (typeof obj === "object") {
        // Iterate through all keys in the object
        for (const key of Object.keys(obj)) {
          // Check if the key corresponds to a configured reference
          const refField = (this.refFields || []).find((rf) =>
            key.startsWith(rf.path + "."),
          );

          if (refField) {
            // Extract the actual field name from the reference (e.g., "name" from "assetTypeIds.name")
            const fieldName = key.slice(refField.path.length + 1);
            const filterValue = obj[key];

            // Find IDs in the referenced model that match the filter
            const filter: FilterQuery<any> = { [fieldName]: filterValue };

            const matchingDocs = await this.connectionManager
              .bindModelToDb(refField.getModel())
              .find(filter)
              .select("_id")
              .session(session);

            const ids = matchingDocs.map((d) => d._id);

            // Replace the original filter with $in for arrays, or single value for non-array
            if (refField.isArray) {
              obj[refField.path] = { $in: ids };
            } else {
              obj[refField.path] = ids.length === 1 ? ids[0] : { $in: ids };
            }

            // Remove the original key with the dot notation
            delete obj[key];
          } else if (typeof obj[key] === "object") {
            // Recursive call for nested objects (sub-$or/$and or nested filters)
            obj[key] = await processObject(obj[key]);
          }
        }
      }
      return obj;
    };

    // Start processing the top-level filters
    return await processObject(newFilters);
  }
  //#endregion

  /**
   * Creates a new record in the database with the given data.
   * The function runs within a transaction and returns the created record.
   * @param data - The data to create the record with.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the created record document.
   */
  async create(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<T> {
    return await runTransaction<T>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);

      // create record
      const record = (await model.create([data], { session: newSession }))[0];
      return record as T;
    });
  }

  /**
   * Updates an existing record in the database with the given data.
   * The function first checks if an _id is present in the data and removes it.
   * Then it calls the findByIdAndUpdate method of the model with the _id, data and the session.
   * The function runs within a transaction and returns the updated record.
   * @param data - The data to update the record with.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the updated record document.
   */
  async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined,
  ): Promise<T> {
    return await runTransaction<T>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);

      // check _id and get it
      const _id = data._id;
      delete data._id;

      // Strip system-managed fields to prevent mass-assignment. These fields
      // are controlled by Mongoose (timestamps, versioning) or set server-side
      // by module overrides (createdBy, active for soft-delete). Module-specific
      // forbidden fields (e.g. roles on User) are handled in each service's
      // own update() override. (C6)
      for (const field of STRIP_FIELDS) {
        delete data[field];
      }

      const record = await model.findByIdAndUpdate(_id, data, {
        session: newSession,
        new: true,
      });

      return record as T;
    });
  }

  /**
   * Deletes a record in the database by setting the active field to false.
   * The function runs within a transaction and returns a boolean indicating whether the deletion was successful.
   * @param _id - The ID of the record to delete.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to a boolean indicating whether the deletion was successful.
   */
  async delete(
    _id: string,
    session: ClientSession | undefined = undefined,
  ): Promise<boolean> {
    return await runTransaction<boolean>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);

      // check _id and update
      const record = await model.findByIdAndUpdate(
        _id,
        {
          active: false,
        },
        {
          session: newSession,
          new: true,
        },
      );

      if (!session) await newSession.commitTransaction();

      // if active is set as true, then false for deleted and viceversa
      return ((record as any)?.active ? false : true) as boolean;
    });
  }

  /**
   * Exports all documents of the collection in CSV format to a file.
   * If data is not provided, it will fetch all documents from the database.
   * The function will return a Promise resolving to a Buffer containing the CSV data.
   * @param data - Optional array of objects to export as CSV.
   * @returns A Promise resolving to a Buffer containing the CSV data.
   */
  async exportCSV(
    data: Record<string, any>[] = [],
    keys?: string[],
  ): Promise<Buffer> {
    try {
      const model = this.connectionManager.bindModelToDb(this.model);

      if (data.length === 0 && !keys) {
        data = (await model.find().lean()).map((item) =>
          JSON.parse(JSON.stringify(item)),
        );
      }

      const normalizedData = data.map((item) => {
        const { _id, id: existingId, __v, ...rest } = item;

        return {
          id: String(_id ?? existingId ?? ""),
          ...rest,
        };
      });

      const availableKeys =
        normalizedData.length > 0
          ? Object.keys(normalizedData[0])
          : Object.keys(model.schema.paths).filter(
              (key) => key !== "_id" && key !== "__v" && !key.includes("."),
            );

      keys = [
        "id",
        ...(keys ?? availableKeys).filter(
          (key) => key !== "id" && key !== "_id" && key !== "__v",
        ),
      ];

      const csv = json2csv(normalizedData, {
        keys,
        preventCsvInjection: true,
      });

      return Buffer.from(csv, "utf-8");
    } catch (err) {
      throw err;
    }
  }

  /**
   * Extracts the field paths of the model's first unique index (excluding
   * _id-only ones) from the schema definition.
   * Used by importCSV to upsert instead of blind-insert so uploads never
   * crash on duplicate-key errors.
   * @returns The unique index field paths, or undefined when the schema has
   * no unique index (beyond _id).
   */
  protected getUniqueIndexFields(): string[] | undefined {
    for (const [index, options] of this.model.schema.indexes()) {
      if (!(options as { unique?: boolean }).unique) continue;

      const fields = Object.keys(index).filter((key) => key !== "_id");
      if (fields.length > 0) return fields;
    }

    return undefined;
  }

  /**
   * Imports a CSV file into the database.
   * The function expects a plain array of objects to be passed as the first argument.
   * The objects should have the same structure as the records in the database.
   *
   * Row identity is resolved by the model's unique index:
   * - Models WITH a unique index (beyond _id) upsert by that key combination:
   *   existing rows update, missing rows are created (schema defaults apply),
   *   and duplicated rows within the file collapse with the last one winning.
   *   Any `id`/`_id` column in the CSV is ignored — the unique key identifies
   *   the row, so re-imports never crash on duplicate-key errors.
   * - Models WITHOUT a unique index fall back to the `id`/`_id` column written
   *   by exportCSV: rows with a valid ObjectId update the record with that
   *   _id, or create it with the same _id when it does not exist; rows without
   *   an id are inserted as-is.
   * System-managed fields (_id in $set, __v, timestamps, createdBy) are
   * stripped from every update.
   *
   * The function runs within a transaction and returns the imported records as an array of documents.
   *
   * @param data - The data to import as a CSV file.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the imported records as an array of documents.
   */
  async importCSV(
    data: Record<string, any>[], // previously sent as a csv file
    session?: ClientSession,
  ): Promise<T[]> {
    return await runTransaction<T[]>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);
      const uniqueFields = this.getUniqueIndexFields();

      // Clean every row: drop identity + system-managed fields. The CSV
      // middleware has already whitelisted fields against the module's DTO.
      const cleanRows = data.map((row) => {
        const cleanRow: Record<string, any> = { ...row };
        const identity = cleanRow._id;
        delete cleanRow._id;
        for (const field of STRIP_FIELDS) delete cleanRow[field];
        return { identity, row: cleanRow };
      });

      // Tracks which rows were imported, for the final re-query.
      const imported: T[] = [];

      if (uniqueFields) {
        // UPSERT BY UNIQUE KEY — the unique index identifies the row, so any
        // `id` column is ignored. Collapse duplicated unique-key combinations
        // within the file first: the index would otherwise reject them (last
        // row wins).
        const keyOf = (row: Record<string, any>) =>
          uniqueFields.map((field) => String(row[field])).join("|");

        const unique = new Map<string, Record<string, any>>();
        for (const { row } of cleanRows) {
          unique.set(keyOf(row), row);
        }
        const rows = [...unique.values()];

        // Find which unique-key combinations already exist so rows can be
        // split into creates (schema defaults apply naturally) and updates
        // (by _id, immune to unique-index races).
        const existingIds = new Map<string, string>();
        const rowFilters = rows.map((row) =>
          Object.fromEntries(uniqueFields.map((field) => [field, row[field]])),
        );
        for (let i = 0; i < rowFilters.length; i += MAX_IMPORT_FILTER_CHUNK) {
          const chunk = rowFilters.slice(i, i + MAX_IMPORT_FILTER_CHUNK);
          const docs = await model
            .find({ $or: chunk })
            .select([...uniqueFields, "_id"].join(" "))
            .session(newSession);
          for (const doc of docs) {
            existingIds.set(
              uniqueFields.map((field) => String((doc as any)[field])).join("|"),
              String(doc._id),
            );
          }
        }

        const newRows = rows.filter((row) => !existingIds.has(keyOf(row)));
        if (newRows.length > 0) {
          await model.create(newRows, {
            session: newSession,
            ordered: true,
          });
        }

        const updateRows = rows.filter((row) => existingIds.has(keyOf(row)));
        if (updateRows.length > 0) {
          const updateOps = updateRows.map((row) => ({
            updateOne: {
              // Guaranteed present: updateRows only contains rows whose key
              // was found in the existence check above.
              filter: { _id: existingIds.get(keyOf(row))! },
              update: { $set: row },
            },
          })) as Parameters<typeof model.bulkWrite>[0];

          for (let i = 0; i < updateOps.length; i += MAX_IMPORT_FILTER_CHUNK) {
            await model.bulkWrite(updateOps.slice(i, i + MAX_IMPORT_FILTER_CHUNK), {
              session: newSession,
            });
          }
        }

        // Re-query the affected rows so the response carries the stored
        // documents (with their _id), matching the import contract.
        for (let i = 0; i < rowFilters.length; i += MAX_IMPORT_FILTER_CHUNK) {
          const chunk = rowFilters.slice(i, i + MAX_IMPORT_FILTER_CHUNK);
          const docs = await model.find({ $or: chunk }).session(newSession);
          imported.push(...(docs as T[]));
        }

        return imported;
      }

      // NO unique index — fall back to the `id`/`_id` column written by
      // exportCSV: update records whose _id exists, create the ones that
      // don't (keeping the imported _id), and plain-insert rows without one.
      const idRows = cleanRows.filter(
        ({ identity }) =>
          identity !== undefined &&
          identity !== null &&
          mongoose.isValidObjectId(identity),
      );
      const plainRows = cleanRows.filter(
        ({ identity }) =>
          !(
            identity !== undefined &&
            identity !== null &&
            mongoose.isValidObjectId(identity)
          ),
      );

      const existingIdEntities = new Set<string>();
      for (let i = 0; i < idRows.length; i += MAX_IMPORT_FILTER_CHUNK) {
        const chunk = idRows
          .slice(i, i + MAX_IMPORT_FILTER_CHUNK)
          .map(({ identity }) => new mongoose.Types.ObjectId(identity));
        const docs = await model
          .find({ _id: { $in: chunk } })
          .select("_id")
          .session(newSession);
        for (const doc of docs) {
          existingIdEntities.add(String(doc._id));
        }
      }

      const idUpdateRows = idRows.filter(({ identity }) =>
        existingIdEntities.has(identity),
      );
      if (idUpdateRows.length > 0) {
        // The ops type is derived from the model's own bulkWrite signature:
        // mongoose's deferred conditional generic (T extends Document ? T : any)
        // cannot be matched by AnyBulkWriteOperation<T> directly.
        const updateOps = idUpdateRows.map(({ identity, row }) => ({
          updateOne: {
            filter: { _id: identity },
            update: { $set: row },
          },
        })) as Parameters<typeof model.bulkWrite>[0];

        for (let i = 0; i < updateOps.length; i += MAX_IMPORT_FILTER_CHUNK) {
          await model.bulkWrite(updateOps.slice(i, i + MAX_IMPORT_FILTER_CHUNK), {
            session: newSession,
          });
        }
      }

      const idNewRows = idRows.filter(
        ({ identity }) => !existingIdEntities.has(identity),
      );
      if (idNewRows.length > 0) {
        // Created with the imported _id so the row identity is preserved.
        await model.create(
          idNewRows.map(({ identity, row }) => ({ ...row, _id: identity })),
          { session: newSession, ordered: true },
        );
      }

      if (plainRows.length > 0) {
        await model.create(plainRows.map(({ row }) => row), {
          session: newSession,
          ordered: true,
        });
      }

      // Re-query the affected rows so the response carries the stored
      // documents (with their _id), matching the import contract.
      const idFilters = idRows.map(({ identity }) => ({
        _id: new mongoose.Types.ObjectId(identity),
      }));
      for (let i = 0; i < idFilters.length; i += MAX_IMPORT_FILTER_CHUNK) {
        const chunk = idFilters.slice(i, i + MAX_IMPORT_FILTER_CHUNK);
        const docs = await model.find({ $or: chunk }).session(newSession);
        imported.push(...(docs as T[]));
      }

      return imported;
    });
  }

  /**
   * Checks if the given data is a pagination result.
   * This function is useful for typeguards and distinguishing between plain arrays and pagination results.
   * @param data - The data to check, either a plain array or a pagination result.
   * @returns {boolean} True if the given data is a pagination result, false otherwise.
   * @example
   * const someData: any = [...];
   * if (isPagination(someData)) {
   *   // code that knows someData is a pagination result
   * }
   */
  isPagination(data: T[] | PaginateResult<T>): data is PaginateResult<T> {
    return (data as PaginateResult<T>).docs !== undefined;
  }
}
