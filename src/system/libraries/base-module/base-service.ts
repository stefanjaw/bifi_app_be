import { ClientSession, PaginateModel, PaginateResult } from "mongoose";
import { orderByQuery, paginationOptions } from "./query-options.type";
import { runTransaction } from "./transaction-utils";

export class BaseService<T> {
  model!: PaginateModel<T>;

  constructor(params: Pick<BaseService<T>, "model">) {
    Object.assign(this, params);
  }

  /**
   * Retrieve records from the database.
   * @param searchParams - The search params as key value pair.
   * @param orderBy - The order by query.
   * @param session - Optional mongoose session.
   * @returns An array of records.
   */
  async get(
    searchParams: Record<string, any>,
    paginationOptions: undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    session: ClientSession | undefined
  ): Promise<T[]>;

  /**
   * Retrieve records from the database.
   * @param searchParams - The search params as key value pair.
   * @param paginationOptions - The pagination options with `paginate` set to `true`.
   * @param orderBy - The order by query.
   * @param session - Optional mongoose session.
   * @returns A mongoose paginate result.
   */
  async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions & { paginate: true },
    orderBy: orderByQuery["orderBy"] | undefined,
    session: ClientSession | undefined
  ): Promise<PaginateResult<T>>;

  /**
   * Retrieve records from the database.
   * @param searchParams - The search params as key value pair.
   * @param paginationOptions - The pagination options.
   * @param orderBy - The order by query.
   * @param session - The mongoose transaction session.
   * @returns A promise that resolves to the retrieved records.
   */
  async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions | undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    session: ClientSession | undefined = undefined
  ): Promise<PaginateResult<T> | T[]> {
    return await runTransaction<PaginateResult<T> | T[]>(
      session,
      async (newSession) => {
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
          records = await this.model.paginate(searchParams, {
            page: paginationOptions.page,
            limit: paginationOptions.limit,
            session: newSession,
            sort: orderByObject,
          });
        } else {
          // non paginated
          records = orderByObject
            ? await this.model
                .find(searchParams)
                .session(newSession)
                .sort(orderByObject)
            : await this.model.find(searchParams).session(newSession);
        }

        return records as PaginateResult<T> | T[];
      }
    );
  }

  /**
   * Creates a record in the database.
   * @param data The data to create the record with.
   * @param session The optional client session to use for the transaction.
   * @returns The created record document.
   */
  async create(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined
  ): Promise<T> {
    return await runTransaction<T>(session, async (newSession) => {
      const record = (
        await this.model.create([data], { session: newSession })
      )[0];

      return record as T;
    });
  }

  /**
   * Updates a record in the database with the given data.
   * The record is identified by the `_id` field in the provided data,
   * which is removed from the update data before performing the update.
   * The function runs within a transaction and returns the updated record.
   *
   * @param data - The data to update the record with. Must include the `_id` of the record to update.
   * @param session - The optional client session to use for the transaction.
   * @returns The updated record document.
   */

  async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined
  ): Promise<T> {
    return await runTransaction<T>(session, async (newSession) => {
      // check _id and get it
      const _id = data._id;
      delete data._id;

      const record = await this.model.findByIdAndUpdate(_id, data, {
        session: newSession,
        new: true,
      });

      return record as T;
    });
  }

  /**
   * Soft deletes a record from the database.
   * @param _id The _id of the record to delete.
   * @param session The optional client session to use for the transaction.
   * @returns A boolean indicating if the deletion was successful.
   */
  async delete(
    _id: string,
    session: ClientSession | undefined = undefined
  ): Promise<boolean> {
    return await runTransaction<boolean>(session, async (newSession) => {
      const record = await this.model.findByIdAndUpdate(
        _id,
        {
          active: false,
        },
        {
          session: newSession,
          new: true,
        }
      );

      if (!session) await newSession.commitTransaction();

      // if active is set as true, then false for deleted and viceversa
      return ((record as any)?.active ? false : true) as boolean;
    });
  }
}
