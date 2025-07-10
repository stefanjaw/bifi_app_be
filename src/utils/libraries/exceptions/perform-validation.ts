import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { ValidationException } from "./service-exception";

interface ValidationErrorDetail {
  path: string;
  messages: string[];
  value?: any;
}

export async function performValidation<T extends object>(
  dto: new () => T,
  data: any
) {
  const object = plainToInstance(dto, data);
  const errors = await validate(object, {
    whitelist: true,
    forbidNonWhitelisted: true,
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
