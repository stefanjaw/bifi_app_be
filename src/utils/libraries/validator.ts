export class Validator {
  private readonly FILE_LIMIT = 5 * 1024 * 1024; // 5MB limit

  validateImageFile(file: Express.Multer.File): void {
    // Assuming the first file is the photo
    if (!file.mimetype.startsWith("image/")) {
      throw new Error("Uploaded file is not a valid image");
    }

    // check size of the file
    if (file.size > this.FILE_LIMIT) {
      throw new Error(
        `File size exceeds the limit of ${this.FILE_LIMIT / (1024 * 1024)}MB`
      );
    }
  }

  validatePDFFile(file: Express.Multer.File): void {
    if (file.mimetype !== "application/pdf") {
      throw new Error("Uploaded file is not a valid PDF");
    }

    // check size of the file
    if (file.size > this.FILE_LIMIT) {
      throw new Error(
        `File size exceeds the limit of ${this.FILE_LIMIT / (1024 * 1024)}MB`
      );
    }
  }

  validateFileType(file: Express.Multer.File, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        `Uploaded file type is not allowed. Allowed types are: ${allowedTypes.join(
          ", "
        )}`
      );
    }

    // check size of the file
    if (file.size > this.FILE_LIMIT) {
      throw new Error(
        `File size exceeds the limit of ${this.FILE_LIMIT / (1024 * 1024)}MB`
      );
    }
  }
}
