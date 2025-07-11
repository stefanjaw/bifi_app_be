import { Request, Response, NextFunction } from "express";
import { performValidation, ValidationException } from "../libraries";

export function validateBodyMiddleware<T extends object>(
  dtoClass: new () => T
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instance = await performValidation(dtoClass, req.body || {});

      req.body = instance;
      next();
    } catch (e) {
      next(e);
    }
  };
}
