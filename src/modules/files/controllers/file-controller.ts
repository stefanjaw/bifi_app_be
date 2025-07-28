import { Request, Response, NextFunction } from "express";
import { BadRequestException, GridFSBucketService } from "../../../system";
import { isValidObjectId } from "mongoose";

export class FileController {
  /**
   * Downloads a file from the database by id
   * @param req - The express Request object containing the id parameter
   * @param res - The express Response object to send the file
   * @param next - The express NextFunction callback to pass control to the next middleware on error
   * @throws {BadRequestException} - If id is not provided
   * @throws {NotFoundException} - If the file is not found
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;

      if (!id) throw new BadRequestException("You must provide an id");
      if (!isValidObjectId(id))
        throw new BadRequestException("Invalid id format");

      const { file, bufferDownload } =
        await GridFSBucketService.getInstance().downloadFile(id);

      res.setHeader(
        "Content-Type",
        file.metadata?.mimetype || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${file.filename}"`
      );

      // Write the buffer to the response
      const data = await bufferDownload;
      res.write(data);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Uploads multiple files to the database
   * @param req - The express Request object containing the files in the "files" field
   */
  async uploadFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const fileIds = await GridFSBucketService.getInstance().uploadFiles(
        files
      );

      res.status(201).json({ fileIds });
    } catch (error) {
      next(error);
    }
  }
}
