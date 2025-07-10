export class ServiceException extends Error {
  code: number;
  errors?: unknown;

  constructor(message: string, code: number, errors?: unknown) {
    super(message);
    this.code = code;
    this.errors = errors;
  }
}

export class ValidationException extends ServiceException {
  constructor(message = "Validation failed", errors?: unknown) {
    super(message, 400, errors);
  }
}

export class MongoException extends ServiceException {
  constructor(message = "Mongo error", errors?: unknown) {
    super(message, 400, errors);
  }
}

export class NotFoundException extends ServiceException {
  constructor(message = "Not found", errors?: unknown) {
    super(message, 404, errors);
  }
}

export class BadRequestException extends ServiceException {
  constructor(message = "Bad request", errors?: unknown) {
    super(message, 400, errors);
  }
}

export class UnauthorizedException extends ServiceException {
  constructor(message = "Unauthorized", errors?: unknown) {
    super(message, 401, errors);
  }
}

export class ForbiddenException extends ServiceException {
  constructor(message = "Forbidden", errors?: unknown) {
    super(message, 403, errors);
  }
}

export class ConflictException extends ServiceException {
  constructor(message = "Conflict", errors?: unknown) {
    super(message, 409, errors);
  }
}

export class InternalServerException extends ServiceException {
  constructor(message = "Server error", errors?: unknown) {
    super(message, 500, errors);
  }
}

export class TooManyRequestsException extends ServiceException {
  constructor(message = "Too many requests", errors?: unknown) {
    super(message, 429, errors);
  }
}
