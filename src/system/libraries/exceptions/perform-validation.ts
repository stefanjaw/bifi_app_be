import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { ValidationException } from "./service-exception";

interface ValidationErrorDetail {
  path: string;
  messages: string[];
  value?: any;
}

/**
 * Validates an object against a given DTO class.
 *
 * @param {new ()=>T} dto The DTO class to validate against.
 * @param {any} data The data to validate.
 * @param {boolean} [forbidNonWhitelisted=true] Whether to forbid the validation of non-whitelisted properties.
 * @returns {Promise<T>} A promise that resolves to the validated object if the validation was successful, or rejects with a ValidationException if the validation failed.
 */
export async function performValidation<T extends object>(
  dto: new () => T,
  data: any,
  forbidNonWhitelisted: boolean = true,
) {
  const object = plainToInstance(dto, data);
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
