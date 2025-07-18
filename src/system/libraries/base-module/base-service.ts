import mongoose, {
  ClientSession,
  PaginateModel,
  PaginateResult,
} from "mongoose";
import { orderByQuery, paginationOptions } from "./query-options.type";

export class BaseService<T> {
  model!: PaginateModel<T>;

  constructor(params: Pick<BaseService<T>, "model">) {
    Object.assign(this, params);
  }

  async get(
    searchParams: Record<string, any>,
    paginationOptions: paginationOptions | undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    session: ClientSession | undefined = undefined
  ): Promise<PaginateResult<T> | T[]> {
    return await this.runTransaction<PaginateResult<T> | T[]>(
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

  async create(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined
  ): Promise<T> {
    return await this.runTransaction<T>(session, async (newSession) => {
      const record = (
        await this.model.create([data], { session: newSession })
      )[0];

      return record as T;
    });
  }

  async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined
  ): Promise<T> {
    return await this.runTransaction<T>(session, async (newSession) => {
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

  async delete(
    _id: string,
    session: ClientSession | undefined = undefined
  ): Promise<boolean> {
    return await this.runTransaction<boolean>(session, async (newSession) => {
      const record = await this.model.findByIdAndUpdate(
        _id,
        {
          active: false,
        },
        {
          session: newSession,
        }
      );

      if (!session) await newSession.commitTransaction();

      // if active is set as true, then false for deleted and viceversa
      return ((record as any)?.active ? false : true) as boolean;
    });
  }

  async runTransaction<T>(
    session: ClientSession | undefined,
    callback: (newSession: ClientSession) => Promise<T>
  ): Promise<T> {
    const newSession = session ? session : await mongoose.startSession();

    try {
      if (!session) newSession.startTransaction();

      // run the callback function
      const result = await callback(newSession);

      if (!session) await newSession.commitTransaction();
      return result as T;
    } catch (error) {
      if (!session) await newSession.abortTransaction();
      throw error;
    } finally {
      if (!session) await newSession.endSession();
    }
  }
}
