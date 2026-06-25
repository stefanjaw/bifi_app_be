import { Request, Response, NextFunction } from "express";
import { performValidation } from "../libraries";

/**
 * Express middleware that validates req.body against the given DTO class.
 * Uses class-validator + class-transformer via performValidation.
 * Replaces req.body with the validated instance on success,
 * or passes a ValidationException to the error handler on failure.
 * @param dtoClass - The DTO class constructor to validate against.
 * @returns An Express middleware function.
 */
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
