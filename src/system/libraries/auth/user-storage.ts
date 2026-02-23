import { UserDocument } from "@mongodb-types";
import { AsyncLocalStorage } from "node:async_hooks";

export const userStorage = new AsyncLocalStorage<{
  user?: UserDocument;
  token?: string;
  dbName?: string;
}>({
  defaultValue: { user: undefined, token: undefined, dbName: undefined },
});
