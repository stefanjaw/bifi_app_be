import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";
import { performValidation, ValidationException } from "../libraries";

/**
 * Middleware factory to validate and transform request body using class-validator and class-transformer.
 * @param dtoClass The DTO class to validate against.
 */
export function validateBody<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const instance = await performValidation(dtoClass, req.body);

    req.body = instance;
    next();
  };
}
