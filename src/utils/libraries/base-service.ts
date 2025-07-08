import mongoose, {
  ClientSession,
  PaginateModel,
  PaginateResult,
} from "mongoose";

export class BaseService<T> {
  private model: PaginateModel<T>;
  private populatingFields: string[] = [];

  constructor(pModel: PaginateModel<T>) {
    this.model = pModel as PaginateModel<T>;
  }

  set setPopulatingFields(fields: string[]) {
    this.populatingFields = fields;
  }

  async get(
    searchParams: Record<string, any>,
    paginationOptions:
      | { paginate: boolean; limit: number; page: number }
      | undefined,
    session: ClientSession | undefined = undefined
  ): Promise<PaginateResult<T> | T[]> {
    const newSession = await this.startSession(session);

    try {
      if (!session) newSession.startTransaction();

      let records;

      if (paginationOptions && paginationOptions?.paginate) {
        // if paginated
        records = await this.model.paginate(searchParams, {
          page: paginationOptions.page,
          limit: paginationOptions.limit,
        });

        if (this.populatingFields.length > 0) {
          await this.model.populate(
            records.docs,
            this.populatingFields.join(" ")
          );
        }
      } else {
        // non paginated
        records = await this.model.find(searchParams);

        if (this.populatingFields.length > 0) {
          await this.model.populate(records, this.populatingFields.join(" "));
        }
      }

      if (!session) await newSession.commitTransaction();
      return records;
    } catch (error) {
      if (!session) await newSession.abortTransaction();
      throw error;
    } finally {
      if (!session) await newSession.endSession();
    }
  }

  async create(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined
  ): Promise<T> {
    const newSession = await this.startSession(session);

    try {
      if (!session) newSession.startTransaction();

      const record = (
        await this.model.create([data], { session: newSession })
      )[0];

      if (!session) await newSession.commitTransaction();
      return record;
    } catch (error) {
      if (!session) await newSession.abortTransaction();
      throw error;
    } finally {
      if (!session) await newSession.endSession();
    }
  }

  async update(
    data: Record<string, any>,
    session: ClientSession | undefined = undefined
  ): Promise<T> {
    const newSession = await this.startSession(session);

    try {
      if (!session) newSession.startTransaction();

      // check _id and get it
      const _id = data._id;
      delete data._id;

      const record = await this.model.findByIdAndUpdate(_id, data, {
        session: newSession,
        new: true,
      });

      if (!session) await newSession.commitTransaction();
      return record as any;
    } catch (error) {
      if (!session) await newSession.abortTransaction();
      throw error;
    } finally {
      if (!session) await newSession.endSession();
    }
  }

  async delete(
    _id: string,
    session: ClientSession | undefined = undefined
  ): Promise<boolean> {
    const newSession = await this.startSession(session);

    try {
      if (!session) newSession.startTransaction();

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
      return (record as any)?.active ? false : true;
    } catch (error) {
      if (!session) await newSession.abortTransaction();
      throw error;
    } finally {
      if (!session) await newSession.endSession();
    }
  }

  async startSession(session: ClientSession | undefined) {
    return session ? session : await mongoose.startSession();
  }
}
