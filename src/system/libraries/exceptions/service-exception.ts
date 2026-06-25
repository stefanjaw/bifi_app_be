/**
 * Base class for all user-facing HTTP errors with a numeric status code and optional structured error details.
 * @param message - Human-readable error description.
 * @param code - HTTP status code.
 * @param errors - Optional structured error details (e.g. validation error array).
 */
export class ServiceException extends Error {
  code: number;
  errors?: unknown;

  constructor(message: string, code: number, errors?: unknown) {
    super(message);
    this.code = code;
    this.errors = errors;
  }
}

/** HTTP 400 – validation failure. @param message - Error description. @param errors - Optional structured error details. */
export class ValidationException extends ServiceException {
  constructor(message = "Validation failed", errors?: unknown) {
    super(message, 400, errors);
  }
}

/** HTTP 400 – MongoDB / persistence error. @param message - Error description. @param errors - Optional structured error details. */
export class MongoException extends ServiceException {
  constructor(message = "Mongo error", errors?: unknown) {
    super(message, 400, errors);
  }
}

/** HTTP 404 – resource not found. @param message - Error description. @param errors - Optional structured error details. */
export class NotFoundException extends ServiceException {
  constructor(message = "Not found", errors?: unknown) {
    super(message, 404, errors);
  }
}

/** HTTP 400 – generic bad request. @param message - Error description. @param errors - Optional structured error details. */
export class BadRequestException extends ServiceException {
  constructor(message = "Bad request", errors?: unknown) {
    super(message, 400, errors);
  }
}

/** HTTP 401 – authentication required / invalid credentials. @param message - Error description. @param errors - Optional structured error details. */
export class UnauthorizedException extends ServiceException {
  constructor(message = "Unauthorized", errors?: unknown) {
    super(message, 401, errors);
  }
}

/** HTTP 403 – authenticated but not permitted. @param message - Error description. @param errors - Optional structured error details. */
export class ForbiddenException extends ServiceException {
  constructor(message = "Forbidden", errors?: unknown) {
    super(message, 403, errors);
  }
}

/** HTTP 409 – duplicate key / conflict. @param message - Error description. @param errors - Optional structured error details. */
export class ConflictException extends ServiceException {
  constructor(message = "Conflict", errors?: unknown) {
    super(message, 409, errors);
  }
}

/** HTTP 500 – unexpected server error. @param message - Error description. @param errors - Optional structured error details. */
export class InternalServerException extends ServiceException {
  constructor(message = "Server error", errors?: unknown) {
    super(message, 500, errors);
  }
}

/** HTTP 429 – rate limit exceeded. @param message - Error description. @param errors - Optional structured error details. */
export class TooManyRequestsException extends ServiceException {
  constructor(message = "Too many requests", errors?: unknown) {
    super(message, 429, errors);
  }
}
