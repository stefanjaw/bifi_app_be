import { Request, Response, NextFunction } from "express";
import { BadRequestException, ConnectionManager } from "../../../system";
import { isValidObjectId } from "mongoose";
import sharp from "sharp";

export class FileController {
  private connectionManager = new ConnectionManager();

  /**
   * Retrieves a file from the database by its id.
   * If the request includes an "imageSize" parameter with a value of "icon", "full", or "preview",
   * the file is resized accordingly before being sent to the client.
   * If the file is not an image, the "imageSize" parameter is ignored.
   *
   * @param req The express Request object, which should contain the "id" parameter.
   * @param res The express Response object.
   * @param next The express NextFunction callback to pass control to the next middleware on error.
   * @throws BadRequestException if no "id" parameter is provided or if the id is invalid.
   * @throws BadRequestException if the "imageSize" parameter is provided and is not "icon", "full", or "preview".
   */
  async getByIdHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const bucket = this.connectionManager.bindBucketToDb();

      const id = req.params.id;
      const imageSize = req.query.imageSize as
        | ("icon" | "full" | "preview")
        | undefined;

      if (!id) throw new BadRequestException("You must provide an id");
      if (!isValidObjectId(id))
        throw new BadRequestException("Invalid id format");

      if (imageSize && !["icon", "full", "preview"].includes(imageSize))
        throw new BadRequestException(
          "Invalid image size parameter, must be 'icon', 'full' or 'preview'"
        );

      const { file, bufferDownload } = await bucket.downloadFile(id);

      res.setHeader(
        "Content-Type",
        file.metadata?.mimetype || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${file.filename}"`
      );

      // Write the buffer to the response
      let data = await bufferDownload;

      // here we parse and rescale the image if needed and file is an image (icon, full, preview)
      if (imageSize && file.metadata?.mimetype.startsWith("image/")) {
        let image = sharp(data);

        if (imageSize === "icon") {
          image = image.resize(100, 100, { fit: "cover" });
        } else if (imageSize === "preview") {
          image = image.resize(800, 800, { fit: "inside" });
        }

        const resizedBuffer = await image.toBuffer();
        data = resizedBuffer;
      }

      res.write(data);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  getById = (req: Request, res: Response, next: NextFunction) => {
    return this.getByIdHandler(req, res, next);
  };

  /**
   * Uploads one or more files to the GridFS bucket.
   *
   * The request must include the "files" property, which is an array of Express.Multer.File objects.
   * The response will contain the "fileIds" property, which is an array of strings representing the IDs of the uploaded files.
   *
   * @throws InternalServerException if there is an error during the upload process.
   */
  async uploadFilesHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const bucket = this.connectionManager.bindBucketToDb();

      const files = req.files as Express.Multer.File[];
      const fileIds = await bucket.uploadFiles(files);

      res.status(201).json({ fileIds });
    } catch (error) {
      next(error);
    }
  }

  uploadFiles = (req: Request, res: Response, next: NextFunction) => {
    return this.uploadFilesHandler(req, res, next);
  };
}
