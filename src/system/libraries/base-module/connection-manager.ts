import mongoose, { PaginateModel } from "mongoose";
import { userStorage } from "../auth/user-storage";
import { GridFSBucketService } from "../file-storage/grid-fs-bucket-service";
import { InternalServerException } from "../exceptions/service-exception";

export class ConnectionManager {
  private static dbCache: Record<string, mongoose.Connection> = {};

  getDefaultDBName = () => {
    return mongoose.connection.db?.databaseName!;
  };

  /**
   * Gets the mongoose database connection for the given database name.
   * If the connection does not exist, it creates a new connection and caches it.
   * @param dbName - The name of the database to use.
   * @returns The mongoose database connection for the given database name.
   * @private
   */
  private getDbByName(dbName: string) {
    if (!ConnectionManager.dbCache[dbName]) {
      ConnectionManager.dbCache[dbName] = mongoose.connection.useDb(dbName);

      const db = ConnectionManager.dbCache[dbName];

      // * Auto register models if not present
      const defaultModels = mongoose.connection.models;

      Object.keys(defaultModels).forEach((modelName) => {
        if (!db.models[modelName]) {
          db.model(modelName, defaultModels[modelName].schema);
        }
      });
    }

    return ConnectionManager.dbCache[dbName];
  }

  /**
   * Binds the given mongoose model to the current database connection.
   * If no database name is provided, it will use the current database name.
   * @param {PaginateModel<T>} [model=this.model] The mongoose model to bind to the database connection.
   * @returns {PaginateModel<T>} The bound mongoose model.
   */
  bindModelToDb<T>(model: PaginateModel<T>) {
    let dbName = userStorage.getStore()?.dbName;

    const defaultDBName = this.getDefaultDBName();

    if (!dbName && defaultDBName) dbName = defaultDBName;

    if (!dbName) throw new InternalServerException("No database name provided");

    const db = this.getDbByName(dbName);

    return (
      (db.models[model.modelName] as PaginateModel<T>) ||
      (db.model(model.modelName, model.schema) as PaginateModel<T>)
    );
  }

  /**
   * Binds a GridFSBucketService to the current database connection.
   * If no database name is provided, it will use the current database name.
   * @returns A GridFSBucketService instance bound to the current database connection.
   */
  bindBucketToDb() {
    let dbName = userStorage.getStore()?.dbName;

    const defaultDBName = this.getDefaultDBName();

    if (!dbName && defaultDBName) dbName = defaultDBName;

    if (!dbName) throw new InternalServerException("No database name provided");

    const db = this.getDbByName(dbName).db;

    if (!db) throw new InternalServerException("No database found");

    return new GridFSBucketService(db);
  }

  /**
   * Retrieves a mongoose model from the database connection associated with the given database name.
   * If no database name is provided, it will use the current database name.
   * @param {string} modelName - The name of the model to retrieve.
   * @returns {PaginateModel<T>} The retrieved mongoose model.
   * @throws {Error} If no database name is provided.
   */
  getModel<T>(modelName: string) {
    let dbName = userStorage.getStore()?.dbName;

    const defaultDBName = this.getDefaultDBName();

    if (!dbName && defaultDBName) dbName = defaultDBName;

    if (!dbName) throw new InternalServerException("No database name provided");

    const db = this.getDbByName(dbName);

    return (
      (db.models[modelName] as PaginateModel<T>) ||
      (db.model(modelName) as PaginateModel<T>)
    );
  }

  /**
   * Retrieves a list of mongoose model names from the database connection associated with the given database name.
   * If no database name is provided, it will use the current database name.
   * @throws {Error} If no database name is provided.
   * @returns {string[]} A list of mongoose model names.
   */
  getModeList() {
    let dbName = userStorage.getStore()?.dbName;

    const defaultDBName = this.getDefaultDBName();

    if (!dbName && defaultDBName) dbName = defaultDBName;

    if (!dbName) throw new InternalServerException("No database name provided");

    return this.getDbByName(dbName).modelNames();
  }
}
