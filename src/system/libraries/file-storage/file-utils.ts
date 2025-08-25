export function isMulterFile(data: unknown): data is Express.Multer.File {
  return !!data && typeof data === "object" && "originalname" in data;
}

export function isMulterFileArray(
  data: unknown
): data is Express.Multer.File[] {
  return Array.isArray(data) && data.every(isMulterFile);
}

export function isValidFileUpload(
  data: unknown
): data is Express.Multer.File | Express.Multer.File[] {
  return (
    data !== undefined &&
    data !== null &&
    (isMulterFile(data) || isMulterFileArray(data))
  );
}
