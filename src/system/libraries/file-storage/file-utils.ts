/**
 * Type guard that checks whether an unknown value is an Express.Multer.File.
 * @param data - The value to check.
 * @returns True if the value is an Express.Multer.File.
 */
export function isMulterFile(data: unknown): data is Express.Multer.File {
  return !!data && typeof data === "object" && "originalname" in data;
}

/**
 * Type guard that checks whether an unknown value is an array of Express.Multer.File.
 * @param data - The value to check.
 * @returns True if the value is an array of Express.Multer.File.
 */
export function isMulterFileArray(
  data: unknown
): data is Express.Multer.File[] {
  return Array.isArray(data) && data.every(isMulterFile);
}

/**
 * Type guard that checks whether an unknown value is a valid file upload
 * (single or array of Express.Multer.File).
 * @param data - The value to check.
 * @returns True if the value is a single or array of Express.Multer.File.
 */
export function isValidFileUpload(
  data: unknown
): data is Express.Multer.File | Express.Multer.File[] {
  return (
    data !== undefined &&
    data !== null &&
    (isMulterFile(data) || isMulterFileArray(data))
  );
}
