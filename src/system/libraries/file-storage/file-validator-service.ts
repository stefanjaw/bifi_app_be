import { ValidationException } from "../exceptions/service-exception";

export class FileValidatorService {
  private readonly FILE_LIMIT = 5 * 1024 * 1024; // 5MB limit

  validateImageFile(file: Express.Multer.File): void {
    // Assuming the first file is the photo
    if (!file.mimetype.startsWith("image/")) {
      throw new ValidationException("Uploaded file is not a valid image");
    }

    // check size of the file
    this.validateMaxSize(file);
  }

  validatePDFFile(file: Express.Multer.File): void {
    if (file.mimetype !== "application/pdf") {
      throw new ValidationException("Uploaded file is not a valid PDF");
    }

    // check size of the file
    this.validateMaxSize(file);
  }

  validateFileType(file: Express.Multer.File, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationException(
        `Uploaded file type is not allowed. Allowed types are: ${allowedTypes.join(
          ", "
        )}`
      );
    }

    // check size of the file
    this.validateMaxSize(file);
  }

  private validateMaxSize(file: Express.Multer.File) {
    if (file.size > this.FILE_LIMIT) {
      throw new ValidationException(
        `File size exceeds the limit of ${this.FILE_LIMIT / (1024 * 1024)}MB`
      );
    }
  }
}
