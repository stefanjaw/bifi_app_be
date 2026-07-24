import { NextFunction, Request, Response } from "express";
import { ServiceException } from "../libraries";

/**
 * Global error-handling middleware.
 * Formats ServiceException subclasses into structured JSON with the correct HTTP status code.
 * Unrecognized errors produce a generic 500 response.
 * @param error - The error object (Express error-handling signature).
 * @param req - The express Request object.
 * @param res - The express Response object.
 * @param _next - The express NextFunction callback (unused but required by Express signature).
 */
export const catchExceptionMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
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
        "Something v2 went wrong processing your request... An internal server error occurred",
      errors: [],
      errorCount: 0,
    });
  }
};
