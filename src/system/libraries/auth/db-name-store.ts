import { AsyncLocalStorage } from "node:async_hooks";

export const dbNameStorage = new AsyncLocalStorage<string | undefined>();
