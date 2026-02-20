import mongoose, { PaginateModel } from "mongoose";
import { dbNameStorage } from "../auth/db-name-store";

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
  private getDb(dbName: string) {
    if (!ConnectionManager.dbCache[dbName]) {
      ConnectionManager.dbCache[dbName] = mongoose.connection.useDb(dbName);
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
    let dbName = dbNameStorage.getStore();

    const defaultDBName = this.getDefaultDBName();

    if (!dbName && defaultDBName) dbName = defaultDBName;

    if (!dbName) throw new Error("No database name provided");

    const db = this.getDb(dbName);

    return (
      (db.models[model.modelName] as PaginateModel<T>) ||
      (db.model(model.modelName, model.schema) as PaginateModel<T>)
    );
  }

  /**
   * Retrieves a mongoose model from the database connection associated with the given database name.
   * If no database name is provided, it will use the current database name.
   * @param {string} modelName - The name of the model to retrieve.
   * @returns {PaginateModel<T>} The retrieved mongoose model.
   * @throws {Error} If no database name is provided.
   */
  getModelByDB<T>(modelName: string) {
    let dbName = dbNameStorage.getStore();

    const defaultDBName = this.getDefaultDBName();

    if (!dbName && defaultDBName) dbName = defaultDBName;

    if (!dbName) throw new Error("No database name provided");

    const db = this.getDb(dbName);

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
    let dbName = dbNameStorage.getStore();

    const defaultDBName = this.getDefaultDBName();

    if (!dbName && defaultDBName) dbName = defaultDBName;

    if (!dbName) throw new Error("No database name provided");

    return this.getDb(dbName).modelNames();
  }
}
