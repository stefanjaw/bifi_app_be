import { RequestHandler } from "express";
import { userStorage } from "./auth/user-storage";

export function withAlsContext(middleware: RequestHandler): RequestHandler {
  return (req, res, next) => {
    const savedStore = userStorage.getStore();
    middleware(req, res, (err?: any) => {
      const currentStore = userStorage.getStore();
      if (savedStore && currentStore !== savedStore) {
        userStorage.enterWith(savedStore);
      }
      next(err);
    });
  };
}
