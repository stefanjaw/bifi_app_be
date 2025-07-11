import { NextFunction, Request, Response } from "express";
import { ServiceException } from "../libraries";

export const catchExceptionMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.log(error)
  if (error instanceof ServiceException) {
    res.status(error.code).json({
      error: true,
      message: error.message,
      errors: error.errors || [],
      errorCount: Array.isArray(error.errors) ? error.errors.length : 0,
    });
  } else {
    res.status(500).json({
      error: true,
      message:
        "Something went wrong processing your request... An internal server error occurred",
      errors: [],
      errorCount: 0,
    });
  }
};
