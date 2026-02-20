import { UserDocument } from "@mongodb-types";
import { AsyncLocalStorage } from "node:async_hooks";

export const userStorage = new AsyncLocalStorage<{
  user: UserDocument | undefined;
  token: string;
}>({
  defaultValue: { user: undefined, token: "" },
});
