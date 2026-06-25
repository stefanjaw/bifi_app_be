import { UserDocument } from "@mongodb-types";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request async context holding the authenticated user, their Firebase token,
 * and the tenant database name (dbName).
 * Initialized at the start of every request in app.ts via userStorage.run().
 */
export const userStorage = new AsyncLocalStorage<{
  user?: UserDocument;
  token?: string;
  dbName?: string;
}>({
  defaultValue: { user: undefined, token: undefined, dbName: undefined },
});
