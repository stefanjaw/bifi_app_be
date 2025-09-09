import { Request, Response, NextFunction } from "express";
import {
  FileValidatorService,
  InternalServerException,
  performValidation,
  ValidationException,
} from "../libraries";
import { Readable } from "stream";
import csvParser from "csv-parser";

/**
 * Validate a CSV file sent in the request body by parsing it and validating each row against
 * the given DTO class.
 *
 * @param dtoClass The DTO class to validate against
 * @returns A middleware function that validates the CSV file and sets req.body to an array of
 * validated objects.
 */
export function validateAndTransformCSVMiddleware<T extends object>(
  dtoClass: new () => T
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // check if a CSV file is provided
    const file = req.file as Express.Multer.File;

    if (!file) {
      next(new ValidationException("CSV file is required"));
      return;
    }

    // validate the file type
    try {
      const fileValidator = new FileValidatorService();
      fileValidator.validateFileType(file, ["text/csv"]);
    } catch (e) {
      next(e);
      return;
    }

    // parse the CSV file
    const results: Record<string, any>[] = [];
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    bufferStream
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("error", (error) => next(new InternalServerException(error.message)))
      .on("end", async () => {
        // check if the CSV file is empty
        if (results.length === 0) {
          next(new ValidationException("CSV file is empty"));
          return;
        }

        try {
          // validate each row against the DTO class
          const data = await Promise.all(
            results.map(async (result) => {
              // normalize empty values to undefined
              Object.keys(result).forEach((key) => {
                if (result[key] === "") result[key] = undefined;
              });

              return await performValidation(dtoClass, result);
            })
          );

          // set the validated data on the request body
          req.body = data;
          next();
        } catch (e) {
          next(e);
        }
      });
  };
}
