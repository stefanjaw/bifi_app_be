import { ValidationException } from "../exceptions/service-exception";

export class FileValidatorService {
  private readonly FILE_LIMIT = 5 * 1024 * 1024; // 5MB limit

  /**
   * Validate if the uploaded file is a valid image
   * @param file the uploaded file
   * @throws ValidationException if the file is not a valid image
   */
  validateImageFile(file: Express.Multer.File): void {
    // Assuming the first file is the photo
    if (!file.mimetype.startsWith("image/")) {
      throw new ValidationException("Uploaded file is not a valid image");
    }

    // check size of the file
    this.validateMaxSize(file);
  }

  /**
   * Validates if the uploaded file is a valid PDF
   * @throws ValidationException if the file is not a valid PDF
   */
  validatePDFFile(file: Express.Multer.File): void {
    if (file.mimetype !== "application/pdf") {
      throw new ValidationException("Uploaded file is not a valid PDF");
    }

    // check size of the file
    this.validateMaxSize(file);
  }

  /**
   * Validates if the uploaded file is of one of the allowed types
   * @param file the uploaded file
   * @param allowedTypes the allowed MIME types
   * @throws ValidationException if the file type is not allowed
   */
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

  /**
   * Validates if the uploaded file does not exceed the maximum allowed size.
   * @param file the uploaded file
   * @throws ValidationException if the file size exceeds the limit
   */
  validateMaxSize(file: Express.Multer.File) {
    if (file.size > this.FILE_LIMIT) {
      throw new ValidationException(
        `File size exceeds the limit of ${this.FILE_LIMIT / (1024 * 1024)}MB`
      );
    }
  }
}
