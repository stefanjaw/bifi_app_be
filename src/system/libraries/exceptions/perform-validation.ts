import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { ValidationException } from "./service-exception";

interface ValidationErrorDetail {
  path: string;
  messages: string[];
  value?: any;
}

/**
 * Parses string values in a FormData-parsed body back to their
 * original types. When the frontend sends FormData, objects/arrays
 * are JSON.stringify'd and dates become quoted ISO strings. This
 * function reverses that so class-transformer decorators work correctly.
 */
function parseFormDataBody(data: any): any {
  if (typeof data !== "object" || data === null) return data;
  if (Array.isArray(data)) return data.map(parseFormDataBody);

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function performValidation<T extends object>(
  dto: new () => T,
  data: any,
  forbidNonWhitelisted: boolean = true
) {
  const parsed = parseFormDataBody(data);
  const object = plainToInstance(dto, parsed);
  const errors = await validate(object, {
    whitelist: true,
    forbidNonWhitelisted: forbidNonWhitelisted,
    validationError: { target: false, value: true },
  });

  if (errors.length === 0) {
    return object;
  }

  const flattenedErrors: ValidationErrorDetail[] = [];

  const processError = (error: ValidationError, parentPath = "") => {
    const currentPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    // If we have direct constraints, add them
    if (error.constraints) {
      flattenedErrors.push({
        path: currentPath,
        messages: Object.values(error.constraints),
        value: error.value,
      });
    }

    // Process array items and nested objects
    if (error.children && error.children.length > 0) {
      error.children.forEach((child) => processError(child, currentPath));
    }
  };

  errors.forEach((error) => processError(error));

  // Sort errors by path for better readability
  flattenedErrors.sort((a, b) => a.path.localeCompare(b.path));

  throw new ValidationException("Validation failed", flattenedErrors);
}
